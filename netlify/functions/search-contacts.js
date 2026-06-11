exports.handler = async function(event) {
  const query = event.queryStringParameters?.query || '';

  if (!query || query.length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Query too short' })
    };
  }

  try {
    const url = `https://services.leadconnectorhq.com/contacts/?locationId=R5PobkV1CRO23kz95yYB&query=${encodeURIComponent(query)}&limit=8`;

    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer pit-4e98487c-3f65-409c-a264-16352f97c01a',
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
