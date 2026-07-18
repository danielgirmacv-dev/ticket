<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(Request $request)
    {
        $query = Faq::query();

        // Non-admins only see published FAQs
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            $query->where('is_published', true);
        } elseif ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $faqs = $query->orderBy('sort_order')->orderBy('question')->get();

        return response()->json($faqs);
    }

    public function store(Request $request)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'category' => 'required|string|max:100',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $faq = Faq::create($validated);

        ActivityLogger::log('created', 'Faq', $faq->id, "Created FAQ: {$faq->question}");

        return response()->json($faq, 201);
    }

    public function show(Faq $faq)
    {
        if (! $faq->is_published && ! auth()->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($faq);
    }

    public function update(Request $request, Faq $faq)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'question' => 'sometimes|string|max:500',
            'answer' => 'sometimes|string',
            'category' => 'sometimes|string|max:100',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $faq->update($validated);

        ActivityLogger::log('updated', 'Faq', $faq->id, "Updated FAQ: {$faq->question}");

        return response()->json($faq);
    }

    public function destroy(Request $request, Faq $faq)
    {
        if (! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $question = $faq->question;
        $faq->delete();

        ActivityLogger::log('deleted', 'Faq', $faq->id, "Deleted FAQ: {$question}");

        return response()->json(null, 204);
    }

    /**
     * FAQ-powered chat assist — no external AI. Scores published FAQs by keyword overlap.
     */
    public function assist(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $message = trim($validated['message']);
        $normalized = strtolower($message);

        // Small talk — no FAQ lookup needed
        if (preg_match('/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i', $normalized)) {
            return response()->json([
                'type' => 'greeting',
                'text' => "Hello! I'm your IT Support Agent. Ask me a question and I'll search our help articles for you.",
            ]);
        }

        if (preg_match('/\b(thank|thanks|thank you|appreciate)\b/i', $normalized)) {
            return response()->json([
                'type' => 'thanks',
                'text' => "You're welcome! Let me know if you need anything else.",
            ]);
        }

        $words = array_values(array_filter(
            preg_split('/\s+/', preg_replace('/[^a-z0-9\s]/', ' ', $normalized)),
            fn ($w) => strlen($w) >= 3 && ! in_array($w, ['the', 'and', 'for', 'how', 'can', 'what', 'when', 'where', 'why', 'does', 'with', 'from', 'that', 'this', 'have', 'are', 'was', 'not', 'you', 'your'])
        ));

        $query = Faq::query()->where('is_published', true);

        if (count($words) > 0) {
            $query->where(function ($q) use ($words) {
                foreach ($words as $word) {
                    $q->orWhere('question', 'like', "%{$word}%")
                        ->orWhere('answer', 'like', "%{$word}%")
                        ->orWhere('category', 'like', "%{$word}%");
                }
            });
        } else {
            $query->where(function ($q) use ($normalized) {
                $q->where('question', 'like', "%{$normalized}%")
                    ->orWhere('answer', 'like', "%{$normalized}%");
            });
        }

        $candidates = $query->get();

        $scored = $candidates->map(function (Faq $faq) use ($words, $normalized) {
            $haystack = strtolower($faq->question.' '.$faq->answer.' '.$faq->category);
            $score = 0;

            if (str_contains($haystack, $normalized)) {
                $score += 10;
            }

            foreach ($words as $word) {
                if (str_contains($haystack, $word)) {
                    $score += 2;
                }
                if (str_contains(strtolower($faq->question), $word)) {
                    $score += 3;
                }
            }

            return ['faq' => $faq, 'score' => $score];
        })
            ->filter(fn ($row) => $row['score'] > 0)
            ->sortByDesc('score')
            ->values();

        if ($scored->isEmpty()) {
            return response()->json([
                'type' => 'fallback',
                'text' => "I couldn't find a matching help article. Browse **Help Center** for more topics, or **Submit a request** if you still need assistance.",
                'matches' => [],
            ]);
        }

        $top = $scored->take(3)->pluck('faq')->values();

        $lines = ["Here's what I found:\n"];
        foreach ($top as $i => $faq) {
            $prefix = $top->count() > 1 ? ($i + 1).'. ' : '';
            $lines[] = $prefix.'**'.$faq->question."**\n".$faq->answer;
            if ($i < $top->count() - 1) {
                $lines[] = '';
            }
        }

        if ($top->count() > 1) {
            $lines[] = "\nSee **Help Center** for all articles.";
        }

        return response()->json([
            'type' => 'faq',
            'text' => implode("\n", $lines),
            'matches' => $top,
        ]);
    }
}
