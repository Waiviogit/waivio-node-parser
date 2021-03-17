exports.createQueue = async ({ client, qname = 'vip_tickets' }) => {
  if (!client) return { error: { message: 'Client is required parameter' } };
  try {
    const res = await client.createQueueAsync({ qname });

    if (res === 1) return { result: true };
    return { result: false };
  } catch (e) {
    if (e.message && e.message === 'Queue exists') return { result: true, message: e.message };
    return { error: e };
  }
};

exports.sendMessage = async ({ client, qname = 'vip_tickets', message }) => {
  if (!client) return { error: { message: 'Client is required parameter' } };
  if (message) {
    try {
      return await client.sendMessageAsync({ qname, message });
    } catch (error) {
      return { error };
    }
  }
};
