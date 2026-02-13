const { registerPaymentMethod } = window.wc.wcBlocksRegistry;

registerPaymentMethod({
    name: 'mm_gateway',
	label: <strong>{mmIntegrationData.title}</strong>,
	ariaLabel: 'Card payment',
	content: <label>{mmIntegrationData.description}</label>,
	edit: <label>This is part of MM Gateway</label>,
	canMakePayment: () => true,
	supports: {
		features: ['products'],
	},
});
