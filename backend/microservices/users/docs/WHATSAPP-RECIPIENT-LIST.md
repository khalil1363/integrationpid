# WhatsApp : "Recipient phone number not in allowed list" (erreur 131030)

En **mode développement**, l’API WhatsApp Cloud n’accepte les envois **que** vers les numéros que vous avez ajoutés à la liste des destinataires de test.

## À faire dans Meta for Developers

1. Allez sur [developers.facebook.com](https://developers.facebook.com/) et ouvrez votre application.
2. Menu **WhatsApp** > **API Setup** (ou **Configuration**).
3. Repérez la section **"To"** / **"Phone numbers"** / **"Manage phone number list"** (ou **"Add phone number"**).
4. Ajoutez le numéro de test au **format international sans +** :  
   **21694689514** (pour un numéro tunisien 94 689 514).
5. Enregistrez. Le destinataire recevra un message WhatsApp l’invitant à accepter les messages de test (si nécessaire).

Après avoir ajouté le numéro, relancez « Mot de passe oublié » avec WhatsApp : l’envoi devrait fonctionner pour ce numéro.

## Format du numéro

- En base de données vous pouvez stocker : **94689514** ou **0612345678** ou **21694689514**.
- Le service envoie toujours à l’API le numéro au format international : **21694689514** (indicatif 216 + 8 chiffres).

## En production

Une fois l’app en production et le numéro WhatsApp Business vérifié, vous pourrez envoyer à n’importe quel numéro (sous réserve des règles WhatsApp : fenêtre 24h ou templates approuvés).
