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
        Schema::create('member_partner_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('age_from')->nullable();
            $table->unsignedTinyInteger('age_to')->nullable();
            $table->unsignedSmallInteger('height_from_cm')->nullable();
            $table->unsignedSmallInteger('height_to_cm')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('children_acceptable')->nullable();

            $table->foreignId('religion_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('caste_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sub_caste')->nullable();

            $table->foreignId('education_level_id')->constrained()->restrictOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();

            $table->string('diet')->nullable();
            $table->string('smoking_acceptable')->nullable();
            $table->string('drinking_acceptable')->nullable();
            $table->string('body_type')->nullable();
            $table->string('complexion')->nullable();
            $table->string('manglik')->nullable();
            $table->string('mother_tongue')->nullable();
            $table->string('family_value')->nullable();
            $table->foreignId('preferred_state_id')->nullable()->constrained('states')->nullOnDelete();
            $table->text('general')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_partner_preferences');
    }
};
