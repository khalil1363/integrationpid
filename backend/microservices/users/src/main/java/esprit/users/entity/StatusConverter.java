package esprit.users.entity;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

@Converter(autoApply = true)
public class StatusConverter implements AttributeConverter<Status, String> {

    @Override
    public String convertToDatabaseColumn(Status status) {
        if (status == null) return "ACTIVE";
        return status.name();
    }

    @Override
    public Status convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return Status.ACTIVE;
        try {
            return Status.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Status.ACTIVE;
        }
    }
}
