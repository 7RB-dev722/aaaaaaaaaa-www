<?php
class WC_Gateway_MM extends WC_Payment_Gateway {
	public $api_key, $webhook_secret, $money_motion;

 	public function __construct() {
		$this->id = 'mm_gateway';

		$this->has_fields = false;

		$this->method_title = 'Money Motion Gateway';
		$this->method_description = 'Merchant gateway that supports card using moneymotion.io';

		$this->supports = ['products'];

		$this->init_form_fields();

		$this->init_settings();

		$this->enabled = $this->get_option( 'enabled' );
		$this->title = $this->get_option('title');
		$this->description = $this->get_option('description');
		$this->api_key = $this->get_option('api_key');
        $this->webhook_secret = $this->get_option('webhook_secret');

        $this->money_motion = new money_motion($this->api_key);

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );

        add_action('woocommerce_api_' . $this->id, array($this, 'webhook'));
 	}

 	public function init_form_fields(){
		$this->form_fields = [
			'enabled' => [
				'title' => 'Enable/Disable',
				'label' => 'Enable card payments with the gateway',
				'type' => 'checkbox',
				'description' => '',
				'default' => 'yes'
			],
			'title' => [
				'title' => 'Title',
				'type' => 'text',
				'description' => 'Payment method name during checkout',
				'default' => 'Card payment',
				'desc_tip' => true
			],
			'description' => [
				'title' => 'Gateway description',
				'type' => 'textarea',
				'default' => 'Through an external website',
				'desc_tip' => true,
				'description' => 'What the users will see the description for the payment method'
			],
			'api_key' => [
				'title' => 'API Key',
				'label' => 'The API Key for Money Motion',
				'type' => 'text',
				'description' => ''
			],
            'webhook_secret' =>[
                'title' => 'Webhook Secret',
                'label' => 'The webhook\'s secret',
                'type' => 'text',
                'description' => ''
            ]
		];
    }

    private function extract_line_items(WC_Order $order){
        $out_line_items = [];
        $items = $order->get_items();
        $estimate_part = $order->get_total();

        foreach($items as $item){
            $amount = $item->get_quantity();

            $out_line_items []= (object)['name' => $item->get_name(),
                'quantity' => $amount,
                'price' => number_format($estimate_part / $amount, 2)
            ];
        }

        return $out_line_items;
    }

	function process_payment( $order_id ) {
    	global $woocommerce;

    	$order = new WC_Order( $order_id );

		$price = $order->get_total();

        $failure_cancel_url = str_replace('http://', 'https://', $order->get_cancel_order_url());

        $success_url = str_replace( 'http://', 'https://', $this->get_return_url($order));

        $items = $this->extract_line_items($order);

        $invoice_checkout = $this->money_motion->create_session($items, $order->get_billing_email(), number_format($price, 2), [
        'price' => $price,
        'wp_order_id' => $order_id
    ], $failure_cancel_url, $success_url, $failure_cancel_url);

    	$woocommerce->cart->empty_cart();

		$order->update_status('pending', 'Waiting for a payment to come');

		return [
			'result' => 'success',
			'redirect' => $invoice_checkout['checkoutUrl'],
        ];
    }

	public function webhook(){
		status_header(200);

        $received_signature = $_SERVER['HTTP_X_CHECKOUT_SIGNATURE'];

        if(!$received_signature){
            status_header(403);

            die('bad_signature');
        }

        $payload = file_get_contents('php://input');

		if($payload === null){
            status_header(403);

			die('bad_payload');
		}

        $hash = base64_encode(hash_hmac('sha512', $payload, $this->webhook_secret, true));

        if($hash !== $received_signature){
            status_header(403);

            die('bad_signature');
        }

		$data = json_decode($payload, true);

		$order_id = $data['metadata']['wp_order_id'];

		$order = wc_get_order($order_id);

		if(!$order){
            status_header(400);
			die('bad_order');
		}

        if($data['event'] === 'checkout_session:new'){
            die('success');
        }

		$status_map = [
            'checkout_session:complete' => 'completed',
            'checkout_session:expired' => 'cancelled',
            'checkout_session:failed' => 'failed',
		];

		$status = $status_map[$data['event']];

		if($status === null){
			$order->update_status('failed', 'not found in the status map');
            status_header(400);
			die('failure');
		}

		$order->update_status($status);

		die('success');
	}
}
