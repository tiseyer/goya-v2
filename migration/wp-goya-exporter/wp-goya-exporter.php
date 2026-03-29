<?php
/**
 * Plugin Name: GOYA Exporter
 * Plugin URI: https://goya.com
 * Description: Exports GOYA user data as chunked JSON for migration to v2.
 * Version: 1.0.0
 * Author: GOYA
 * License: GPL v2 or later
 * Text Domain: goya-exporter
 */

defined('ABSPATH') || exit;

/**
 * GOYA_Exporter
 *
 * Provides an admin page under Tools > GOYA Export for exporting WordPress
 * user data as chunked JSON files for migration to GOYA v2 (Supabase).
 *
 * READ-ONLY: This plugin performs zero writes to the WordPress database.
 * All queries are SELECT — no INSERT, UPDATE, or DELETE operations anywhere.
 */
class GOYA_Exporter {

    /**
     * Constructor — register hooks.
     */
    public function __construct() {
        add_action('admin_menu', [$this, 'register_admin_page']);
        add_action('admin_init', [$this, 'handle_export']);
    }

    // -------------------------------------------------------------------------
    // Admin Page
    // -------------------------------------------------------------------------

    /**
     * Register the plugin admin page under Tools > GOYA Export.
     */
    public function register_admin_page(): void {
        add_management_page(
            'GOYA Export',
            'GOYA Export',
            'manage_options',
            'goya-export',
            [$this, 'render_admin_page']
        );
    }

    /**
     * Render the admin page HTML.
     */
    public function render_admin_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        // Count all users for the info display
        $user_counts = count_users();
        $total_users = $user_counts['total_users'];

        // Preserve previously submitted values so the form re-populates on errors
        $selected_chunk_size   = isset($_POST['goya_chunk_size'])    ? intval($_POST['goya_chunk_size'])    : 250;
        $selected_offset       = isset($_POST['goya_offset'])        ? intval($_POST['goya_offset'])        : 0;
        $selected_role_filter  = isset($_POST['goya_role_filter'])   ? sanitize_text_field($_POST['goya_role_filter'])   : 'all';
        $selected_status_filter = isset($_POST['goya_status_filter']) ? sanitize_text_field($_POST['goya_status_filter']) : 'all';
        ?>
        <div class="wrap">
            <h1>GOYA User Export</h1>

            <p>Export WordPress user data as chunked JSON files for migration to GOYA v2.</p>

            <p class="description" style="background:#fff3cd;border-left:4px solid #ffc107;padding:8px 12px;margin:12px 0;">
                <strong>Warning:</strong> Export All may be slow for 4000+ users. Use chunked export for large databases.
            </p>

            <form method="post" action="">
                <?php wp_nonce_field('goya_export_nonce', 'goya_nonce'); ?>

                <table class="form-table">
                    <tbody>

                        <tr>
                            <th scope="row">
                                <label for="goya_chunk_size">Chunk Size</label>
                            </th>
                            <td>
                                <select name="goya_chunk_size" id="goya_chunk_size">
                                    <option value="100"  <?php selected($selected_chunk_size, 100);  ?>>100</option>
                                    <option value="250"  <?php selected($selected_chunk_size, 250);  ?>>250 (recommended)</option>
                                    <option value="500"  <?php selected($selected_chunk_size, 500);  ?>>500</option>
                                </select>
                                <p class="description">Number of users per exported chunk file.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="goya_offset">Offset</label>
                            </th>
                            <td>
                                <input
                                    type="number"
                                    name="goya_offset"
                                    id="goya_offset"
                                    value="<?php echo esc_attr($selected_offset); ?>"
                                    min="0"
                                    step="1"
                                    class="small-text"
                                />
                                <p class="description">Starting position (0 = beginning). Increment by chunk size for sequential exports.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="goya_role_filter">Role Filter</label>
                            </th>
                            <td>
                                <select name="goya_role_filter" id="goya_role_filter">
                                    <option value="all"           <?php selected($selected_role_filter, 'all');           ?>>All Users</option>
                                    <option value="subscriber"    <?php selected($selected_role_filter, 'subscriber');    ?>>Subscribers Only</option>
                                    <option value="teacher"       <?php selected($selected_role_filter, 'teacher');       ?>>Teachers Only</option>
                                    <option value="wellness"      <?php selected($selected_role_filter, 'wellness');      ?>>Wellness Practitioners Only</option>
                                    <option value="administrator" <?php selected($selected_role_filter, 'administrator'); ?>>Admins Only</option>
                                </select>
                                <p class="description">Filter users by their WordPress role.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="goya_status_filter">Status Filter</label>
                            </th>
                            <td>
                                <select name="goya_status_filter" id="goya_status_filter">
                                    <option value="all"    <?php selected($selected_status_filter, 'all');    ?>>All Members</option>
                                    <option value="active" <?php selected($selected_status_filter, 'active'); ?>>Active Members Only</option>
                                </select>
                                <p class="description">
                                    "Active Members Only" includes only users with at least one active WooCommerce subscription.
                                    This filter is applied after BuddyBoss / WooCommerce enrichment (Plan 02).
                                </p>
                            </td>
                        </tr>

                    </tbody>
                </table>

                <p class="submit">
                    <input
                        type="submit"
                        name="goya_export_chunk"
                        value="Export Chunk"
                        class="button button-primary"
                    />
                    &nbsp;
                    <input
                        type="submit"
                        name="goya_export_all"
                        value="Export All"
                        class="button button-secondary"
                    />
                </p>

            </form>

            <hr />
            <p>
                <strong>Total users in database:</strong> <?php echo number_format($total_users); ?>
            </p>
            <p class="description">
                Use the offset + chunk size to paginate through all users.
                For example: chunk 1 = offset 0, chunk 2 = offset 250, chunk 3 = offset 500, etc.
            </p>

        </div>
        <?php
    }

    // -------------------------------------------------------------------------
    // Export Handler
    // -------------------------------------------------------------------------

    /**
     * Handle form submissions for chunk or full export.
     * Triggered on admin_init so headers can still be sent.
     */
    public function handle_export(): void {
        // Only act when one of our buttons was clicked
        if (!isset($_POST['goya_export_chunk']) && !isset($_POST['goya_export_all'])) {
            return;
        }

        // Capability check
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions.'));
        }

        // Nonce verification
        if (!isset($_POST['goya_nonce']) || !wp_verify_nonce($_POST['goya_nonce'], 'goya_export_nonce')) {
            wp_die(__('Security check failed. Please refresh and try again.'));
        }

        // Read and sanitize POST parameters
        $chunk_size    = isset($_POST['goya_chunk_size'])    ? intval($_POST['goya_chunk_size'])    : 250;
        $offset        = isset($_POST['goya_offset'])        ? intval($_POST['goya_offset'])        : 0;
        $role_filter   = isset($_POST['goya_role_filter'])   ? sanitize_text_field($_POST['goya_role_filter'])   : 'all';
        $status_filter = isset($_POST['goya_status_filter']) ? sanitize_text_field($_POST['goya_status_filter']) : 'all';

        // Clamp chunk size to allowed values
        if (!in_array($chunk_size, [100, 250, 500], true)) {
            $chunk_size = 250;
        }

        // Determine number / offset for the query
        if (isset($_POST['goya_export_all'])) {
            // Export All — fetch every matching user
            $number = -1;
            $offset = 0;
            $limit  = -1; // used only for filename
        } else {
            // Export Chunk — use provided offset + chunk_size
            $number = $chunk_size;
            $limit  = $chunk_size;
        }

        // Build WP_User_Query arguments (SELECT only — READ-ONLY)
        $args = [
            'number'  => $number,
            'offset'  => $offset,
            'orderby' => 'ID',
            'order'   => 'ASC',
        ];

        // Apply role filter when a specific role is selected
        if ($role_filter !== 'all') {
            $args['role'] = $role_filter;
        }

        // Execute the user query (SELECT — no writes)
        $user_query = new WP_User_Query($args);
        $users_raw  = $user_query->get_results();

        // Build export data array for each user
        $export_data = [];
        foreach ($users_raw as $user) {
            $export_data[] = $this->build_user_data($user);
        }

        // Apply active-only filter if selected (runs after enrichment so subscriptions[] is populated)
        if ($status_filter === 'active') {
            $export_data = array_filter($export_data, function($user) {
                if (empty($user['subscriptions'])) {
                    return false;
                }
                foreach ($user['subscriptions'] as $sub) {
                    if ($sub['status'] === 'active') {
                        return true;
                    }
                }
                return false;
            });
            $export_data = array_values($export_data); // Re-index
        }

        // Send the JSON file to the browser
        $this->send_json_download($export_data, $offset, $limit ?? $chunk_size);
    }

    // -------------------------------------------------------------------------
    // User Data Builder
    // -------------------------------------------------------------------------

    /**
     * Build the export object for a single WordPress user.
     * Includes BuddyBoss xprofile data, avatar URL, and WooCommerce subscriptions.
     *
     * @param WP_User $user WordPress user object.
     * @return array Export data array.
     */
    public function build_user_data(WP_User $user): array {
        return [
            'wp_id'         => $user->ID,
            'email'         => $user->user_email,
            'display_name'  => $user->display_name,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'role'          => !empty($user->roles) ? $user->roles[0] : 'subscriber',
            'roles'         => !empty($user->roles) ? array_values($user->roles) : array('subscriber'),
            'registered_at' => $user->user_registered,
            'profile'       => $this->get_xprofile_data($user->ID),
            'avatar_url'    => $this->get_avatar_url($user->ID),
            'subscriptions' => $this->get_subscriptions($user->ID),
        ];
    }

    // -------------------------------------------------------------------------
    // BuddyBoss Enrichment
    // -------------------------------------------------------------------------

    /**
     * Get BuddyBoss xprofile data for a user, organized by field group.
     * Skips groups marked as "(legacy)". Unserializes stored array values.
     * Returns empty array if BuddyBoss is not active.
     *
     * @param int $user_id WordPress user ID.
     * @return array Profile data keyed by snake_case group name, then field name.
     */
    private function get_xprofile_data(int $user_id): array {
        // Guard: BuddyBoss not active
        if (!function_exists('bp_is_active') || !bp_is_active('xprofile')) {
            return [];
        }

        global $wpdb;

        // Query all xprofile field values for this user
        // JOIN bp_xprofile_data (d) with bp_xprofile_fields (f) on field_id
        // to get field names alongside values
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT f.name AS field_name, f.group_id, d.value
             FROM {$wpdb->prefix}bp_xprofile_data d
             INNER JOIN {$wpdb->prefix}bp_xprofile_fields f ON d.field_id = f.id
             WHERE d.user_id = %d",
            $user_id
        ));

        // Also get group names for context
        $groups = $wpdb->get_results(
            "SELECT id, name FROM {$wpdb->prefix}bp_xprofile_groups"
        );
        $group_map = [];
        foreach ($groups as $g) {
            $group_map[$g->id] = $g->name;
        }

        // Build structured profile data organized by group
        $profile = [];
        foreach ($results as $row) {
            $group_name = $group_map[$row->group_id] ?? 'Other';

            // Skip legacy groups
            if (stripos($group_name, '(legacy)') !== false) {
                continue;
            }

            // Sanitize group name to snake_case key
            $group_key = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($group_name)));
            $field_key = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($row->field_name)));

            // Unserialize if value is serialized (BuddyBoss stores arrays serialized)
            $value = maybe_unserialize($row->value);

            if (!isset($profile[$group_key])) {
                $profile[$group_key] = [];
            }
            $profile[$group_key][$field_key] = $value;
        }

        return $profile;
    }

    /**
     * Get the BuddyBoss avatar URL for a user.
     * Returns URL string (not HTML img tag). Returns empty string if
     * BuddyBoss is not active or no avatar is set.
     *
     * @param int $user_id WordPress user ID.
     * @return string Avatar URL or empty string.
     */
    private function get_avatar_url(int $user_id): string {
        // Guard: BuddyBoss not active
        if (!function_exists('bp_core_fetch_avatar')) {
            return '';
        }

        $avatar = bp_core_fetch_avatar([
            'item_id' => $user_id,
            'type'    => 'full',
            'html'    => false, // Returns URL string, not HTML img tag
        ]);

        return $avatar ?: '';
    }

    // -------------------------------------------------------------------------
    // WooCommerce Enrichment
    // -------------------------------------------------------------------------

    /**
     * Get WooCommerce subscription data for a user.
     * Returns empty array if WooCommerce Subscriptions is not active.
     * Includes Stripe customer/subscription IDs from post meta.
     *
     * @param int $user_id WordPress user ID.
     * @return array Subscription records.
     */
    private function get_subscriptions(int $user_id): array {
        // Guard: WooCommerce Subscriptions not active
        if (!function_exists('wcs_get_subscriptions')) {
            return [];
        }

        $subscriptions = wcs_get_subscriptions([
            'customer_id'            => $user_id,
            'subscriptions_per_page' => -1,
        ]);

        $result = [];
        foreach ($subscriptions as $sub) {
            $sub_id   = $sub->get_id();
            $result[] = [
                'subscription_id'        => $sub_id,
                'status'                 => $sub->get_status(),
                'start_date'             => $sub->get_date('start'),
                'end_date'               => $sub->get_date('end'),
                'stripe_customer_id'     => get_post_meta($sub_id, '_stripe_customer_id', true),
                'stripe_subscription_id' => get_post_meta($sub_id, '_stripe_subscription_id', true),
            ];
        }

        return $result;
    }

    /**
     * Check whether a user has at least one active WooCommerce subscription.
     * Used as a fast check for the active-only status filter.
     *
     * @param int $user_id WordPress user ID.
     * @return bool True if the user has an active subscription.
     */
    private function has_active_subscription(int $user_id): bool {
        if (!function_exists('wcs_get_subscriptions')) {
            return false;
        }
        $subs = wcs_get_subscriptions([
            'customer_id'            => $user_id,
            'subscription_status'    => 'active',
            'subscriptions_per_page' => 1,
        ]);
        return !empty($subs);
    }

    // -------------------------------------------------------------------------
    // JSON Download
    // -------------------------------------------------------------------------

    /**
     * Send users array as a downloadable JSON file.
     *
     * @param array $users  Array of user export objects.
     * @param int   $offset Starting offset (used in filename for chunk exports).
     * @param int   $limit  Chunk size, or -1 for Export All.
     */
    public function send_json_download(array $users, int $offset, int $limit): void {
        // Determine filename
        $filename = ($limit === -1)
            ? 'goya-export-all.json'
            : "goya-export-chunk-{$offset}-{$limit}.json";

        // Send headers (must happen before any output)
        header('Content-Type: application/json; charset=utf-8');
        header("Content-Disposition: attachment; filename={$filename}");
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Output JSON and terminate (READ-ONLY — no database writes)
        echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Initialise the plugin
new GOYA_Exporter();
