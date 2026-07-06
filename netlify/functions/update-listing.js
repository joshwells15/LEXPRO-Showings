// netlify/functions/update-listing.js
// Updates a GHL contact with listing address + price, then sets
// seller_transactions = "Listing Live" — which triggers the existing
// GHL workflow (seller email, pipeline move) and Make sheet-row scenario.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { contactId, street, city, state, zip, price, side, liveDate } = JSON.parse(event.body || '{}');

    if (!contactId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No contact selected.' }) };
    }
    if (!street || !city || !state || !zip) {
      return { statusCode: 400, body: JSON.stringify({ error: 'All address fields are required.' }) };
    }

    const customFields = [
      { key: 'seller__subject_property_street',   field_value: street.trim() },
      { key: 'seller__subject_property_city',     field_value: city.trim() },
      { key: 'seller__subject_property_state',    field_value: state.trim() },
      { key: 'seller__subject_property_zip_code', field_value: zip.trim() },
      { key: 'seller_transactions',               field_value: 'Listing Live' },
    ];

    if (side) {
      // represented_side is a multi-select dropdown in GHL — value must be an array
      customFields.push({ key: 'represented_side', field_value: [side] });
    }

    if (liveDate) {
      // listing_live is a date picker — YYYY-MM-DD
      customFields.push({ key: 'listing_live', field_value: liveDate });
    }

    if (price) {
      const cleanPrice = String(price).replace(/[^0-9.]/g, '');
      if (cleanPrice) {
        customFields.push({ key: 'listing_price', field_value: cleanPrice });
      }
    }

    const res = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customFields }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data.message || 'GHL rejected the update.' }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
