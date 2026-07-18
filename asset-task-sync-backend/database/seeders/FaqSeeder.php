<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'How do I reset my password?',
                'answer' => "Go to Settings → Security, enter your current password, then set a new password (at least 8 characters). If you cannot sign in, contact your IT admin to reset your account.",
                'category' => 'Account',
                'sort_order' => 1,
            ],
            [
                'question' => 'How long does it take for a ticket to be answered?',
                'answer' => "Response times depend on priority:\n• Critical — within 2 hours\n• High — within 4 hours\n• Medium — within 1–2 business days\n• Low — within 3–5 business days",
                'category' => 'General',
                'sort_order' => 2,
            ],
            [
                'question' => 'My printer is offline. What should I try first?',
                'answer' => "1. Check that the printer is powered on and has paper/toner.\n2. Restart the printer and your computer.\n3. Confirm you are connected to the office network/Wi‑Fi.\n4. Try printing a test page from another PC.\nIf it still fails, submit a Repair request with a photo of any error lights or messages.",
                'category' => 'Hardware',
                'sort_order' => 3,
            ],
            [
                'question' => 'How do I request access to a system or software?',
                'answer' => "Submit a New Request with type “Other / Access / Account”. Include the system name, why you need access, and your manager’s approval if required. You do not need to select an asset for access requests.",
                'category' => 'Access',
                'sort_order' => 4,
            ],
            [
                'question' => 'Why don’t I see any assets on the request form?',
                'answer' => "Assets appear only after an admin assigns them to your account. If nothing shows up, ask your IT admin to assign your computer or other equipment to you.",
                'category' => 'General',
                'sort_order' => 5,
            ],
            [
                'question' => 'I cannot connect to Wi‑Fi / VPN. What now?',
                'answer' => "Forget the network and reconnect using your work credentials. For VPN, confirm your account is active and you are using the latest VPN client. If the problem continues, submit a Network-related request with your location and any error message.",
                'category' => 'Network',
                'sort_order' => 6,
            ],
            [
                'question' => 'Can I cancel a request after submitting it?',
                'answer' => "Yes. Open My Requests, open the ticket, and cancel it while it is still in Submitted status. Once it is approved or assigned, ask an admin to cancel it for you.",
                'category' => 'General',
                'sort_order' => 7,
            ],
            [
                'question' => 'How do I attach a screenshot to my request?',
                'answer' => "On the New Request form, use Attachments to upload screenshots or photos (JPG, PNG, PDF — max 5 files, 5MB each). Clear images of error messages help technicians resolve issues faster.",
                'category' => 'General',
                'sort_order' => 8,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::firstOrCreate(
                ['question' => $faq['question']],
                array_merge($faq, ['is_published' => true])
            );
        }
    }
}
