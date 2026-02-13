<?php
class money_motion{
    private $curl, $url;

    function __construct($api_key){
        $this->url = "https://moneymotion.io/api/";

        $this->curl = curl_init();

        curl_setopt($this->curl, CURLOPT_POST, true);
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, true);

        curl_setopt($this->curl, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: $api_key"
        ]);
    }

    public function create_session(
$items,
$email,
$amount,
$data_to_be_passed,
$cancel_url,
$success_url,
$failure_url
){
        $data = json_encode([
            'userIp' => $_SERVER['REMOTE_ADDR'],
            'userEmail' => $email,
            'total' => $amount,
            'metadata' => $data_to_be_passed,
            'cancelUrl' => $cancel_url,
            'successUrl' => $success_url,
            'failureUrl' => $failure_url,
            'lineItems' => $items
        ]);

        curl_setopt($this->curl, CURLOPT_URL, $this->url . 'createCheckoutSession');

        curl_setopt( $this->curl, CURLOPT_POSTFIELDS, $data);

        $exec = curl_exec($this->curl);

        return json_decode($exec, true);
    }

    function __destruct(){
        curl_close($this->curl);
    }

}

