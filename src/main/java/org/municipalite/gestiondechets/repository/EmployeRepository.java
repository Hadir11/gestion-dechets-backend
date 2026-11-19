package org.municipalite.gestiondechets.repository;

import org.municipalite.gestiondechets.model.Employe;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface EmployeRepository extends MongoRepository<Employe, String> {

    // AJOUTEZ UNIQUEMENT CETTE LIGNE
    Optional<Employe> findByUsername(String username);
    Optional<Employe> findByEmailIgnoreCase(String email);
    long countByRoleCode(String roleCode);

    // Gardez vos autres méthodes
    List<Employe> findByRole(String role);
    List<Employe> findByRoleCodeIn(Collection<String> roleCodes);
    List<Employe> findByDisponibleTrue();
    List<Employe> findByRoleAndDisponibleTrue(String role);
}
