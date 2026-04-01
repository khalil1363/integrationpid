package esprit.users.repository;

import esprit.users.entity.Role;
import esprit.users.entity.Status;
import esprit.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE " +
        "(:search IS NULL OR :search = '' OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
        "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
        "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
        "AND (:role IS NULL OR u.role = :role) " +
        "AND (:status IS NULL OR u.status = :status)")
    List<User> searchUsers(@Param("search") String search, @Param("role") Role role, @Param("status") Status status);
}

