<?php

namespace App\Support;

class Roles
{
    /** Staff roles — everyone who runs the site rather than being a matrimonial member. */
    public const TEAM = ['super_admin', 'admin', 'accounts'];

    /** The matrimonial member role. */
    public const MEMBER = 'user';

    public static function isTeam(?string $role): bool
    {
        return in_array($role, self::TEAM, true);
    }
}
