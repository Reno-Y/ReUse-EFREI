<%- include('../partials/header') %>
<div class="container">
  <h1 class="page-title">Gestion des utilisateurs</h1>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Email</th>
          <th>Rôle</th>
          <th>Statut</th>
          <th>Inscrit le</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <% users.forEach(u => { %>
          <tr>
            <td><%= u.first_name %> <%= u.last_name %></td>
            <td><%= u.email %></td>
            <td><span class="badge badge-role-<%= u.role %>"><%= u.role %></span></td>
            <td><span class="badge <%= u.is_active ? 'badge-active' : 'badge-inactive' %>"><%= u.is_active ? 'Actif' : 'Inactif' %></span></td>
            <td class="text-muted"><%= u.created_at.slice(0, 10) %></td>
            <td class="actions-cell">
              <a href="/users/<%= u.id %>/edit" class="btn-sm">Modifier</a>
              <a href="/users/<%= u.id %>/delete" class="btn-sm btn-danger">Supprimer</a>
            </td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  </div>

  <% if (totalPages > 1) { %>
    <nav class="pagination">
      <% for (let p = 1; p <= totalPages; p++) { %>
        <a href="?page=<%= p %>" class="page-link <%= p === currentPage ? 'active' : '' %>"><%= p %></a>
      <% } %>
    </nav>
  <% } %>
</div>
<%- include('../partials/footer') %>
