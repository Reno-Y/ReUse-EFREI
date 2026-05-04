<%- include('partials/header') %>
<div class="container form-page">
  <h1 class="page-title">Connexion</h1>
  <% if (locals.errors && errors.length) { %>
    <ul class="errors-list">
      <% errors.forEach(e => { %><li><%= e %></li><% }) %>
    </ul>
  <% } %>
  <form method="POST" action="/login" class="form-card">
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" value="<%= locals.old ? old.email || '' : '' %>" required autocomplete="email">
    </div>
    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" required autocomplete="current-password">
    </div>
    <button type="submit" class="btn-primary btn-block">Se connecter</button>
  </form>
  <p class="form-footer">Pas encore de compte ? <a href="/register">Créer un compte</a></p>
</div>
<%- include('partials/footer') %>
