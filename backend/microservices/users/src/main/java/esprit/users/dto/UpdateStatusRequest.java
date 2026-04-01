package esprit.users.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class UpdateStatusRequest {

    /** ID de l'admin qui effectue l'action (vérifié côté service). */
    @NotNull(message = "Admin ID is required")
    private Long adminId;

    @NotNull(message = "Status is required")
    private String status; // ACTIVE, INACTIVE, PENDING
}
