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
        Schema::create('member_residencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->foreignId('native_state_id')->nullable()->constrained('states')->nullOnDelete();
            $table->foreignId('native_district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->foreignId('current_state_id')->nullable()->constrained('states')->nullOnDelete();
            $table->foreignId('current_district_id')->nullable()->constrained('districts')->nullOnDelete();
            $table->text('current_address')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('immigration_status')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_residencies');
    }
};
