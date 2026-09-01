// API Route Vercel — crée un PaymentIntent Stripe
// Endpoint : POST /api/create-payment-intent

export default async function handler(req, res) {
  console.log('--- create-payment-intent appelée ---');
  console.log('Méthode HTTP:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  console.log('STRIPE_SECRET_KEY présente ?', !!secretKey);
  console.log('STRIPE_SECRET_KEY commence par:', secretKey ? secretKey.substring(0, 7) : 'ABSENTE');

  if (!secretKey) {
    console.error('ERREUR: STRIPE_SECRET_KEY manquante dans les variables d'environnement Vercel.');
    return res.status(500).json({ error: "STRIPE_SECRET_KEY manquante dans les variables d'environnement Vercel." });
  }

  try {
    // req.body est déjà un objet sur Vercel (parsé automatiquement)
    const body = req.body || {};
    const product = body.product === 'templates' ? 'templates' : 'pack';

    const AMOUNTS = {
      pack: { amount: 2990, name: 'Pack MONQUÉBEC' },
      templates: { amount: 1900, name: 'Templates CV Canadien' }
    };
    const selected = AMOUNTS[product];

    const params = new URLSearchParams();
    params.append('amount', selected.amount);
    params.append('currency', 'eur');
    params.append('automatic_payment_methods[enabled]', 'true');
    params.append('metadata[product]', selected.name);

    console.log('Appel à Stripe en cours...');
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + secretKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    console.log('Réponse Stripe - statut:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur retournée par Stripe:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error ? data.error.message : 'Erreur Stripe inconnue.' });
    }

    console.log('PaymentIntent créé avec succès.');
    return res.status(200).json({
      clientSecret: data.client_secret,
      productName: selected.name,
      amount: selected.amount
    });
  } catch (err) {
    console.error('EXCEPTION dans la fonction:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
