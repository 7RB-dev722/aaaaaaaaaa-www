<?php
use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

class WC_Gateway_MM_Blocks extends AbstractPaymentMethodType {
	protected $name = 'card';

	public function initialize(){
		$this->settings = get_option('woocommerce_mm_gateway_settings');
	}

    public function get_payment_method_script_handles() {
		wp_register_script(
			'wc-mm-blocks-integration',
			MM_WOOCOMMERCE_GATEWAY_URL . '/js/mm-block.js',
			[],
			'1.0.0',
			true
		);

		wp_localize_script('wc-mm-blocks-integration', 'mmIntegrationData', [
			'title' => $this->settings['title'],
			'description' => $this->settings['description']
		]);

		return ['wc-mm-blocks-integration'];
    }

	public function is_active(){
		return $this->settings['enabled'] === 'yes';
	}
}

