<?php

use App\Models\MemberProfile;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Human-facing member id, e.g. HMTR15103342. System-generated and
        // immutable once assigned; distinct from the auto-increment key.
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->string('profile_id', 20)->nullable()->after('user_id');
        });

        // Backfill any rows that predate this column before enforcing NOT NULL/unique.
        DB::table('member_profiles')->whereNull('profile_id')->orderBy('id')
            ->pluck('id')
            ->each(function (int $id): void {
                DB::table('member_profiles')
                    ->where('id', $id)
                    ->update(['profile_id' => MemberProfile::generateProfileId()]);
            });

        Schema::table('member_profiles', function (Blueprint $table) {
            $table->string('profile_id', 20)->nullable(false)->change();
            $table->unique('profile_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->dropUnique(['profile_id']);
            $table->dropColumn('profile_id');
        });
    }
};
