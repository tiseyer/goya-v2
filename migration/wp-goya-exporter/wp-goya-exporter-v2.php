<?php
/**
 * Plugin Name: GOYA Exporter v2
 * Plugin URI: https://goya.com
 * Description: Exports GOYA user data as chunked JSON for migration to v2 — includes wp_user_id, username, and extended subscription data.
 * Version: 2.0.0
 * Author: GOYA
 * License: GPL v2 or later
 * Text Domain: goya-exporter-v2
 */

defined('ABSPATH') || exit;

/**
 * GOYA_Exporter_V2
 *
 * Extends the original exporter with:
 * - wp_user_id and username fields per user record
 * - Extended subscription data (next_payment_date, billing_period/interval, total, currency, items)
 * - Chunk size option 1000
 * - Parallel to v1 (separate menu slug)
 *
 * READ-ONLY: This plugin performs zero writes to the WordPress database.
 */
class GOYA_Exporter_V2 {

    public function __construct() {
        add_action('admin_menu', [$this, 'register_admin_page']);
        add_action('admin_init', [$this, 'handle_export']);
    }

    // -------------------------------------------------------------------------
    // Admin Page
    // -------------------------------------------------------------------------

    public function register_admin_page(): void {
        add_management_page(
            'GOYA Export v2',
            'GOYA Export v2',
            'manage_options',
            'goya-export-v2',
            [$this, 'render_admin_page']
        );
    }

    public function render_admin_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $user_counts = count_users();
        $total_users = $user_counts['total_users'];

        $selected_chunk_size    = isset($_POST['goya_chunk_size'])    ? intval($_POST['goya_chunk_size'])    : 500;
        $selected_offset        = isset($_POST['goya_offset'])        ? intval($_POST['goya_offset'])        : 0;
        $selected_role_filter   = isset($_POST['goya_role_filter'])   ? sanitize_text_field($_POST['goya_role_filter'])   : 'all';
        $selected_status_filter = isset($_POST['goya_status_filter']) ? sanitize_text_field($_POST['goya_status_filter']) : 'all';
        ?>
        <div class="wrap">
            <h1>GOYA User Export v2</h1>

            <p>Export WordPress user data as chunked JSON files for migration to GOYA v2.<br>
            <strong>v2 additions:</strong> <code>wp_user_id</code>, <code>username</code>, extended subscription data.</p>

            <p class="description" style="background:#fff3cd;border-left:4px solid #ffc107;padding:8px 12px;margin:12px 0;">
                <strong>Warning:</strong> Export All may be slow for 4000+ users. Use chunked export for large databases.
            </p>

            <form method="post" action="">
                <?php wp_nonce_field('goya_export_v2_nonce', 'goya_nonce_v2'); ?>

                <table class="form-table">
                    <tbody>

                        <tr>
                            <th scope="row"><label for="goya_chunk_size">Chunk Size</label></th>
                            <td>
                                <select name="goya_chunk_size" id="goya_chunk_size">
                                    <option value="100"  <?php selected($selected_chunk_size, 100);  ?>>100</option>
                                    <option value="250"  <?php selected($selected_chunk_size, 250);  ?>>250</option>
                                    <option value="500"  <?php selected($selected_chunk_size, 500);  ?>>500 (recommended)</option>
                                    <option value="1000" <?php selected($selected_chunk_size, 1000); ?>>1000</option>
                                </select>
                                <p class="description">Number of users per exported chunk file.</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><label for="goya_offset">Offset</label></th>
                            <td>
                                <input type="number" name="goya_offset" id="goya_offset"
                                       value="<?php echo esc_attr($selected_offset); ?>"
                                       min="0" step="1" class="small-text" />
                                <p class="description">Starting position (0 = beginning).</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><label for="goya_role_filter">Role Filter</label></th>
                            <td>
                                <select name="goya_role_filter" id="goya_role_filter">
                                    <option value="all"           <?php selected($selected_role_filter, 'all');           ?>>All Users</option>
                                    <option value="subscriber"    <?php selected($selected_role_filter, 'subscriber');    ?>>Subscribers Only</option>
                                    <option value="teacher"       <?php selected($selected_role_filter, 'teacher');       ?>>Teachers Only</option>
                                    <option value="wellness"      <?php selected($selected_role_filter, 'wellness');      ?>>Wellness Practitioners Only</option>
                                    <option value="administrator" <?php selected($selected_role_filter, 'administrator'); ?>>Admins Only</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row"><label for="goya_status_filter">Status Filter</label></th>
                            <td>
                                <select name="goya_status_filter" id="goya_status_filter">
                                    <option value="all"    <?php selected($selected_status_filter, 'all');    ?>>All Members</option>
                                    <option value="active" <?php selected($selected_status_filter, 'active'); ?>>Active Members Only</option>
                                </select>
                                <p class="description">
                                    "Active Members Only" = users with at least one active WooCommerce subscription.
                                </p>
                            </td>
                        </tr>

                    </tbody>
                </table>

                <p class="submit">
                    <input type="submit" name="goya_export_chunk" value="Export Chunk" class="button button-primary" />
                    &nbsp;
                    <input type="submit" name="goya_export_all" value="Export All" class="button button-secondary" />
                </p>

            </form>

            <hr />
            <p><strong>Total users in database:</strong> <?php echo number_format($total_users); ?></p>
            <p class="description">
                Use offset + chunk size to paginate. Chunk 1 = offset 0, Chunk 2 = offset 500, etc.
            </p>
        </div>
        <?php
    }

    // -------------------------------------------------------------------------
    // Export Handler
    // -------------------------------------------------------------------------

    public function handle_export(): void {
        if (!isset($_POST['goya_export_chunk']) && !isset($_POST['goya_export_all'])) {
            return;
        }
        if (!current_user_can('manage_options')) {
            wp_die(__('Insufficient permissions.'));
        }
        if (!isset($_POST['goya_nonce_v2']) || !wp_verify_nonce($_POST['goya_nonce_v2'], 'goya_export_v2_nonce')) {
            wp_die(__('Security check failed. Please refresh and try again.'));
        }

        $chunk_size    = isset($_POST['goya_chunk_size'])    ? intval($_POST['goya_chunk_size'])    : 500;
        $offset        = isset($_POST['goya_offset'])        ? intval($_POST['goya_offset'])        : 0;
        $role_filter   = isset($_POST['goya_role_filter'])   ? sanitize_text_field($_POST['goya_role_filter'])   : 'all';
        $status_filter = isset($_POST['goya_status_filter']) ? sanitize_text_field($_POST['goya_status_filter']) : 'all';

        if (!in_array($chunk_size, [100, 250, 500, 1000], true)) {
            $chunk_size = 500;
        }

        if (isset($_POST['goya_export_all'])) {
            $number = -1;
            $offset = 0;
            $limit  = -1;
        } else {
            $number = $chunk_size;
            $limit  = $chunk_size;
        }

        $args = [
            'number'  => $number,
            'offset'  => $offset,
            'orderby' => 'ID',
            'order'   => 'ASC',
        ];

        if ($role_filter !== 'all') {
            $args['role'] = $role_filter;
        }

        $user_query = new WP_User_Query($args);
        $users_raw  = $user_query->get_results();

        $export_data = [];
        foreach ($users_raw as $user) {
            $export_data[] = $this->build_user_data($user);
        }

        if ($status_filter === 'active') {
            $export_data = array_filter($export_data, function($user) {
                if (empty($user['subscriptions'])) return false;
                foreach ($user['subscriptions'] as $sub) {
                    if ($sub['status'] === 'active') return true;
                }
                return false;
            });
            $export_data = array_values($export_data);
        }

        $this->send_json_download($export_data, $offset, $limit ?? $chunk_size);
    }

    // -------------------------------------------------------------------------
    // User Data Builder
    // -------------------------------------------------------------------------

    public function build_user_data(WP_User $user): array {
        return [
            'wp_user_id'    => $user->ID,
            'username'      => $user->user_login,
            'wp_id'         => $user->ID, // kept for backward compat with v1 importers
            'email'         => $user->user_email,
            'display_name'  => $user->display_name,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'role'          => !empty($user->roles) ? $user->roles[0] : 'subscriber',
            'roles'         => !empty($user->roles) ? array_values($user->roles) : ['subscriber'],
            'registered_at' => $user->user_registered,
            'profile'       => $this->get_xprofile_data($user->ID),
            'avatar_url'    => $this->get_avatar_url($user->ID),
            'subscriptions' => $this->get_subscriptions($user->ID),
        ];
    }

    // -------------------------------------------------------------------------
    // BuddyBoss Enrichment
    // -------------------------------------------------------------------------

    private function get_xprofile_data(int $user_id): array {
        if (!function_exists('bp_is_active') || !bp_is_active('xprofile')) {
            return [];
        }

        global $wpdb;

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT f.name AS field_name, f.group_id, d.value
             FROM {$wpdb->prefix}bp_xprofile_data d
             INNER JOIN {$wpdb->prefix}bp_xprofile_fields f ON d.field_id = f.id
             WHERE d.user_id = %d",
            $user_id
        ));

        $groups = $wpdb->get_results(
            "SELECT id, name FROM {$wpdb->prefix}bp_xprofile_groups"
        );
        $group_map = [];
        foreach ($groups as $g) {
            $group_map[$g->id] = $g->name;
        }

        $profile = [];
        foreach ($results as $row) {
            $group_name = $group_map[$row->group_id] ?? 'Other';
            if (stripos($group_name, '(legacy)') !== false) continue;

            $group_key = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($group_name)));
            $field_key = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($row->field_name)));

            $value = maybe_unserialize($row->value);

            if (!isset($profile[$group_key])) {
                $profile[$group_key] = [];
            }
            $profile[$group_key][$field_key] = $value;
        }

        return $profile;
    }

    private function get_avatar_url(int $user_id): string {
        if (!function_exists('bp_core_fetch_avatar')) {
            return '';
        }

        $avatar = bp_core_fetch_avatar([
            'item_id' => $user_id,
            'type'    => 'full',
            'html'    => false,
        ]);

        return $avatar ?: '';
    }

    // -------------------------------------------------------------------------
    // WooCommerce Enrichment (Extended)
    // -------------------------------------------------------------------------

    private function get_subscriptions(int $user_id): array {
        if (!function_exists('wcs_get_subscriptions')) {
            return [];
        }

        $subscriptions = wcs_get_subscriptions([
            'customer_id'            => $user_id,
            'subscriptions_per_page' => -1,
        ]);

        $result = [];
        foreach ($subscriptions as $sub) {
            $sub_id = $sub->get_id();

            // Build items array from subscription line items
            $items = [];
            foreach ($sub->get_items() as $item) {
                $product_id = $item->get_product_id();
                $items[] = [
                    'product_id'   => $product_id,
                    'product_name' => $item->get_name(),
                    'quantity'     => $item->get_quantity(),
                ];
            }

            $result[] = [
                'subscription_id'        => $sub_id,
                'status'                 => $sub->get_status(),
                'start_date'             => $sub->get_date('start'),
                'end_date'               => $sub->get_date('end'),
                'next_payment_date'      => $sub->get_date('next_payment'),
                'billing_period'         => $sub->get_billing_period(),
                'billing_interval'       => (int) $sub->get_billing_interval(),
                'total'                  => $sub->get_total(),
                'currency'               => $sub->get_currency(),
                'items'                  => $items,
                'stripe_customer_id'     => get_post_meta($sub_id, '_stripe_customer_id', true),
                'stripe_subscription_id' => get_post_meta($sub_id, '_stripe_subscription_id', true),
            ];
        }

        return $result;
    }

    // -------------------------------------------------------------------------
    // JSON Download
    // -------------------------------------------------------------------------

    public function send_json_download(array $users, int $offset, int $limit): void {
        $filename = ($limit === -1)
            ? 'goya-export-v2-all.json'
            : "goya-export-v2-chunk-{$offset}-{$limit}.json";

        header('Content-Type: application/json; charset=utf-8');
        header("Content-Disposition: attachment; filename={$filename}");
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

new GOYA_Exporter_V2();
