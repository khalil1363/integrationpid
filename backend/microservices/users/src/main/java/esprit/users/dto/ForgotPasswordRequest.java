package esprit.users.dto;

import lombok.Data;

@Data
public class ForgotPasswordRequest {

    /** Email de l'utilisateur (utilisé si channel = EMAIL). */
    private String email;

    /** Numéro de téléphone (utilisé si channel = WHATSAPP). */
    private String phone;

    /**
     * Canal de réception du code : "EMAIL", "WHATSAPP" ou "BOTH".
     * Optionnel, par défaut "EMAIL" pour compatibilité.
     */
    private String channel;

    public String getResolvedChannel() {
        if (channel == null || channel.isBlank()) {
            return "EMAIL";
        }
        String upper = channel.trim().toUpperCase();
        if (!upper.equals("EMAIL") && !upper.equals("WHATSAPP") && !upper.equals("BOTH")) {
            return "EMAIL";
        }
        return upper;
    }
}

