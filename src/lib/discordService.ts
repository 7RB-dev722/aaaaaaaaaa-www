
interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

export const discordService = {
  async sendPurchaseNotification(webhookUrl: string, details: {
    productName: string;
    price: string;
    paymentMethod: string;
    customerEmail?: string;
    customerPhone?: string;
    orderId?: string;
    title?: string;
  }, avatarUrl?: string, mentionId?: string) {
    if (!webhookUrl) {
      console.warn('Discord Service: No webhook URL provided');
      return;
    }

    console.log('Discord Service: Sending notification to', webhookUrl.substring(0, 30) + '...');
    
    const payload: DiscordWebhookPayload = {
      username: 'Cheatloop Order',
      avatar_url: avatarUrl,
      content: mentionId ? `<@${mentionId}>` : undefined,
      embeds: [
        {
          title: details.title || '🚀 New Purchase Order',
          color: 0x00ff00, // Green color
          fields: [
            {
              name: 'Product',
              value: details.productName,
              inline: true,
            },
            {
              name: 'Price',
              value: details.price,
              inline: true,
            },
            {
              name: 'Payment Method',
              value: details.paymentMethod,
              inline: true,
            },
            {
              name: 'Customer Email',
              value: details.customerEmail || 'Not provided',
              inline: true,
            },
            {
              name: 'Customer Phone',
              value: details.customerPhone || 'Not provided',
              inline: true,
            },
            {
              name: 'Order ID',
              value: details.orderId || 'N/A',
              inline: false,
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Cheatloop Admin System',
          }
        }
      ]
    };

    try {
      console.log('Discord Service: Payload:', JSON.stringify(payload, null, 2));
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discord Service Error:', response.status, response.statusText, errorText);
        throw new Error(`Discord Webhook failed: ${response.status} ${errorText}`);
      }
      console.log('Discord Service: Notification sent successfully');
    } catch (error) {
      console.error('Discord Service: Notification failed:', error);
      throw error;
    }
  },

  async sendManualMessage(webhookUrl: string, content: string, avatarUrl?: string, mentionId?: string) {
    if (!webhookUrl) {
      throw new Error('No webhook URL provided');
    }

    const payload: DiscordWebhookPayload = {
      username: 'Cheatloop Support',
      avatar_url: avatarUrl,
      content: mentionId ? `<@${mentionId}> ${content}` : content,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Discord Service: Manual message failed:', error);
      throw error;
    }
  },

  async sendInvoice(webhookUrl: string, invoice: {
    productName: string;
    price: string;
    orderId: string;
    status: 'Paid' | 'Pending' | 'Refunded';
    date: string;
    customerName?: string;
  }, avatarUrl?: string, mentionId?: string) {
    if (!webhookUrl) {
      throw new Error('No webhook URL provided');
    }

    const statusColor = {
      'Paid': 0x00ff00, // Green
      'Pending': 0xffa500, // Orange
      'Refunded': 0xff0000 // Red
    };

    const payload: DiscordWebhookPayload = {
      username: 'Cheatloop Billing',
      avatar_url: avatarUrl,
      content: mentionId ? `<@${mentionId}> Here is your invoice details:` : undefined,
      embeds: [{
        title: '🧾 Invoice Details',
        color: statusColor[invoice.status] || 0x0099ff,
        fields: [
          { name: 'Order ID', value: invoice.orderId, inline: true },
          { name: 'Status', value: invoice.status, inline: true },
          { name: 'Date', value: invoice.date, inline: true },
          { name: 'Product', value: invoice.productName, inline: false },
          { name: 'Amount', value: invoice.price, inline: true },
          { name: 'Customer', value: invoice.customerName || 'Valued Customer', inline: true },
        ],
        footer: { text: 'Thank you for your business!' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send invoice: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Discord Service: Invoice failed:', error);
      throw error;
    }
  },

  async sendDirectMessage(botToken: string, userId: string, content?: string, embed?: DiscordEmbed) {
    if (!botToken) throw new Error('No Bot Token provided');
    if (!userId) throw new Error('No User ID provided');

    try {
      // 1. Create DM Channel
      const channelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: userId }),
      });

      if (!channelResponse.ok) {
        const errorText = await channelResponse.text();
        throw new Error(`Failed to create DM channel: ${channelResponse.status} ${errorText}`);
      }

      const channel = await channelResponse.json();
      const channelId = channel.id;

      // 2. Send Message
      const messagePayload = {
        content: content,
        embeds: embed ? [embed] : undefined,
      };

      const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        throw new Error(`Failed to send DM: ${messageResponse.status} ${errorText}`);
      }
      
      return await messageResponse.json();

    } catch (error) {
      console.error('Discord Service: Direct Message failed:', error);
      throw error;
    }
  }
};
