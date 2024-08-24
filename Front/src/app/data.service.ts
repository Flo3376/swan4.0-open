import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public commands = [
    {
      phrases: [
        "tu es là",
        "Es-tu disponible",
        "Es-tu connecté",
        "Peux-tu me répondre",
        "Es-tu prêt à aider",
        "Es-tu en ligne",
        "Peux-tu interagir",
        "Es-tu actif maintenant",
        "Es-tu accessible",
        "Es-tu prêt à communiquer",
        "Peux-tu assister maintenant"
      ],
      code: "test_swan",
      response: [
        "Non, je dort encore papa",
        "Bonjour ! Heureux de vous voir, prêt à aider.",
        "Salut ! Je suis là, à votre service.",
        "Bonjour ! Comment puis-je vous assister aujourd'hui ?",
        "Salutations ! Toujours à votre écoute.",
        "Bonjour ! Prêt à répondre à toutes vos questions.",
        "Je suis à votre disposition, comment puis-je vous aider ?",
        "Bonjour ! Je suis prêt à vous aider, n'hésitez pas à demander.",
        "Salut ! Comment puis-je vous être utile aujourd'hui ?",
        "Bonjour ! Toujours prête à vous assister avec enthousiasme.",
        "Salutations ! Toujours à votre écoute.",
        "Hello ! Je suis ici, prêt à vous aider à tout moment."
      ],
      action: {
        output: "none"
      }
    },
    {
      phrases: [
        "Tu te portes bien ",
        "Ça va",
        "Tout va bien chez toi",
        "Comment vas-tu",
        "Comment tu vas",
        "Ça se passe bien",
        "Es-tu en bonne santé"
      ],
      code: "test_swan_2",
      response: [
        "Oui, je vais très bien, merci !",
        "Tout va bien de mon côté, et toi ?",
        "Je suis en pleine forme, merci de demander.",
        "Ça va bien, et j'espère que toi aussi.",
        "Oui, tout est parfait ici !",
        "Je me porte bien, merci.",
        "Ça va super, merci !",
        "Je suis en bonne santé et heureux.",
        "Tout est en ordre, merci.",
        "Je vais bien, merci de t'en soucier."
      ],
      action: {
        output: "none"
      }
    },
    {
      phrases: [
        "Peux-tu démarrer la musique",
        "Mets de la musique",
        "Lance la lecture sur Spotify",
        "relance la musique",
        "Lance la musique"
      ],
      code: "spotify_play",
      response: [
        "Musique démarrée sur Spotify.",
        "Lecture en cours."
      ],
      action: {
        output: "none"
      }
    },
    {
      phrases: [
        "Réactive toi"
      ],
      code: "present_mod",
      response: [
        "Redémarrage, je suis de retour"
      ],
      action: {
        output: "none"
      }
    },
    {
      phrases: [
        "Dis bonjour à l'univers"
      ],
      code: "hello_world",
      response: [
        "ok",
        "d'accord, ",
        "j'envoie le message",
        "message envoyé"
      ],
      action: {
        output: "keyboard",
        type: "phrase",
        action_input: "{Enter}Salut tous le monde, bob est de retour// Hello everyone, Bob is back{Enter}",
        duration: "short"
      }
    }
  ]
}
