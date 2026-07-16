<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    /**
     * Existing rows hold absolute URLs baked in from whichever APP_URL was set
     * at upload time (e.g. http://localhost:8000/storage/member-photos/x.jpg),
     * which only resolve on that one host. Reduce them to the disk-relative
     * path the model now expects; MemberPhoto::$url rebuilds the URL per
     * request. Rows already stored relative are left alone, so this is safe to
     * re-run.
     */
    public function up(): void
    {
        foreach (DB::table('member_photos')->select('id', 'path')->get() as $photo) {
            $path = $this->toRelativePath($photo->path);

            if ($path !== $photo->path) {
                DB::table('member_photos')->where('id', $photo->id)->update(['path' => $path]);
            }
        }
    }

    public function down(): void
    {
        foreach (DB::table('member_photos')->select('id', 'path')->get() as $photo) {
            if (! preg_match('#^https?://#i', $photo->path)) {
                DB::table('member_photos')
                    ->where('id', $photo->id)
                    ->update(['path' => Storage::disk('public')->url($photo->path)]);
            }
        }
    }

    private function toRelativePath(string $stored): string
    {
        // Handles both absolute URLs and root-relative /storage/... values.
        $path = ltrim((string) parse_url($stored, PHP_URL_PATH), '/');

        return preg_replace('#^storage/#', '', $path);
    }
};
