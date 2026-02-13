<?php
/*
 * Plugin Name: Money Motion
 * Plugin URI: https://moneymotion.io/
 * Description: Another gateway
 * Author: Fabio C
 * Author URI: https://github.com/fingu
 * Version: 0.0.1
 */

defined( 'ABSPATH' ) or exit;

if (!in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins')))){
	return;
}

define( 'MM_WOOCOMMERCE_GATEWAY_URL', untrailingslashit( plugins_url( basename( plugin_dir_path( __FILE__ ) ), basename( __FILE__ ) ) ) );

require 'money_motion.php';

function mm_init_gateway_class() {
	require 'mm-gateway-class.php';
}

add_action( 'plugins_loaded', 'mm_init_gateway_class', 11);

function mm_add_gateway_class( $gateways ) {
    $gateways[] = 'WC_Gateway_MM';
    return $gateways;
}

add_filter( 'woocommerce_payment_gateways', 'mm_add_gateway_class' );

function mm_blocks_support() {
	if (!class_exists('Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType')) {
        return;
    }

	require 'mm-gateway-blocks.php';

	add_action('woocommerce_blocks_payment_method_type_registration', function( Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry ) {
		$payment_method_registry->register(new WC_Gateway_MM_Blocks());
	});
}

add_action( 'woocommerce_blocks_loaded', 'mm_blocks_support' );
