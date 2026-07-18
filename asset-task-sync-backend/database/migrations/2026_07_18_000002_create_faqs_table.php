<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('question');
            $table->text('answer');
            $table->string('category')->default('General');
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('is_published');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
