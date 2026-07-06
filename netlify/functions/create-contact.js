// netlify/functions/create-contact.js
// Creates (or upserts) a contact in GHL. Uses upsert so duplicate phone/email
// updates the existing contact instead of erroring.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { firstName, lastName, phone, email } = JSON.parse(event.body || '{}');

    if (!firstName || !lastName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'First and last name are required.' }) };
    }
    if (!phone && !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Phone or email is required.' }) };
    }

    // Normalize phone to E.164 (+1XXXXXXXXXX)
    let cleanPhone = '';
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) cleanPhone = '+1' + digits;
      else if (digits.length === 11 && digits.startsWith('1')) cleanPhone = '+' + digits;
      else cleanPhone = '+' + digits;
    }

    const body = {
      locationId: 'R5PobkV1CRO23kz95yYB',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    if (cleanPhone) body.phone = cleanPhone;
    if (email) body.email = email.trim();

    const res = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data.message || 'GHL rejected the request.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        contactId: data.contact && data.contact.id ? data.contact.id : null,
        isNew: data.new === true,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
