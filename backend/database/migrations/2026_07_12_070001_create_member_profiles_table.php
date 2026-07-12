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
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->enum('gender', ['male', 'female']);
            $table->date('date_of_birth');
            $table->string('marital_status')->nullable();
            $table->unsignedTinyInteger('children')->nullable();
            $table->string('on_behalf')->nullable();
            $table->string('mother_tongue')->nullable();
            $table->json('known_languages')->nullable();
            $table->text('introduction')->nullable();

            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->string('complexion')->nullable();
            $table->string('body_type')->nullable();
            $table->string('blood_group', 5)->nullable();
            $table->string('disability')->nullable();

            $table->string('diet')->nullable();
            $table->string('drink')->nullable();
            $table->string('smoke')->nullable();
            $table->string('living_with')->nullable();

            $table->string('sun_sign')->nullable();
            $table->string('moon_sign')->nullable();
            $table->string('time_of_birth')->nullable();
            $table->string('birth_city')->nullable();
            $table->string('manglik')->nullable();

            $table->text('hobbies')->nullable();
            $table->text('interests')->nullable();
            $table->text('music')->nullable();
            $table->text('movies')->nullable();
            $table->text('sports')->nullable();
            $table->text('cuisines')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
