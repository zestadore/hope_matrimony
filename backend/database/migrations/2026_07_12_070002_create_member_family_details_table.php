<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('member_family_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->foreignId('religion_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('caste_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sub_caste')->nullable();
            $table->string('community_value')->nullable();

            $table->string('father_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('siblings')->nullable();
            $table->string('family_status')->nullable();
            $table->string('family_value')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_family_details');
    }
};
