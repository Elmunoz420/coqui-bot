package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;
import java.util.Optional;

@Repository
@Transactional
@EnableTransactionManagement
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByUsernameIgnoreCase(String username);
    Optional<Usuario> findByNombreIgnoreCase(String nombre);
    Optional<Usuario> findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(String username);
    Optional<Usuario> findFirstByNombreIgnoreCaseOrderByIdUsuarioAsc(String nombre);
}
