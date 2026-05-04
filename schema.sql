<%- include('../partials/header') %>
<div class="container form-page">
  <h1 class="page-title">Modifier le profil</h1>
  <% if (locals.errors && errors.length) { %>
    <ul class="errors-list"><% errors.forEach(e => { %><li><%= e %></li><% }) %></ul>
  <% } %>
  <form method="POST" action="/users/<%= target.id %>/edit" class="form-card">
    <div class="form-row">
      <div class="form-group">
        <label for="first_name">Prénom</label>
        <input type="text" id="first_name" name="first_name" value="<%= old.first_name || '' %>" required>
      </div>
      <div class="form-group">
        <label for="last_name">Nom</label>
        <input type="text" id="last_name" name="last_name" value="<%= old.last_name || '' %>" required>
      </div>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" value="<%= old.email || '' %>" required>
    </div>
    <div class="form-group">
      <label for="password">Nouveau mot de passe <small>(laisser vide pour ne pas changer)</small></label>
      <input type="password" id="password" name="password" minlength="8" autocomplete="new-password">
    </div>
    <% if (user.role === 'admin') { %>
      <div class="form-row">
        <div class="form-group">
          <label for="role">Rôle</label>
          <select id="role" name="role">
            <option value="user" <%= old.role === 'user' ? 'selected' : '' %>>Utilisateur</option>
            <option value="admin" <%= old.role === 'admin' ? 'selected' : '' %>>Administrateur</option>
          </select>
        </div>
        <div class="form-group">
          <label for="is_active">Statut</label>
          <select id="is_active" name="is_active">
            <option value="1" <%= old.is_active ? 'selected' : '' %>>Actif</option>
            <option value="0" <%= !old.is_active ? 'selected' : '' %>>Inactif</option>
          </select>
        </div>
      </div>
    <% } %>
    <button type="submit" class="btn-primary btn-block">Enregistrer</button>
  </form>
</div>
<%- include('../partials/footer') %>
