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
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->dropColumn(['sun_sign', 'moon_sign']);
            $table->string('malayalam_star')->nullable()->after('birth_city');
            $table->string('sudha_jathakam')->nullable()->after('manglik');
            $table->string('jathakam_path')->nullable()->after('sudha_jathakam');
            $table->string('jathakam_original_name')->nullable()->after('jathakam_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->dropColumn(['malayalam_star', 'sudha_jathakam', 'jathakam_path', 'jathakam_original_name']);
            $table->string('sun_sign')->nullable()->after('time_of_birth');
            $table->string('moon_sign')->nullable()->after('sun_sign');
        });
    }
};
