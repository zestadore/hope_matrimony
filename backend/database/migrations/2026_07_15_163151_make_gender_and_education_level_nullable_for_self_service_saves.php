<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A self-registered member saves one profile section at a time and nothing
 * is mandatory, so these columns (previously required by the admin's
 * all-at-once creation flow) must accept null too.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->enum('gender', ['male', 'female'])->nullable()->change();
            $table->date('date_of_birth')->nullable()->change();
        });

        Schema::table('member_educations', function (Blueprint $table) {
            $table->foreignId('education_level_id')->nullable()->change();
        });

        Schema::table('member_partner_preferences', function (Blueprint $table) {
            $table->foreignId('education_level_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->enum('gender', ['male', 'female'])->nullable(false)->change();
            $table->date('date_of_birth')->nullable(false)->change();
        });

        Schema::table('member_educations', function (Blueprint $table) {
            $table->foreignId('education_level_id')->nullable(false)->change();
        });

        Schema::table('member_partner_preferences', function (Blueprint $table) {
            $table->foreignId('education_level_id')->nullable(false)->change();
        });
    }
};
