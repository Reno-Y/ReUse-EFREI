<%- include('../partials/header') %>
<div class="container">
  <div class="section-header">
    <h1 class="page-title">Annonces</h1>
    <% if (user) { %><a href="/listings/create" class="btn-primary">+ Publier</a><% } %>
  </div>

  <form method="GET" action="/listings" class="filters-form">
    <select name="category">
      <option value="">Toutes catégories</option>
      <% categories.forEach(c => { %>
        <option value="<%= c %>" <%= filters.category === c ? 'selected' : '' %>><%= c %></option>
      <% }) %>
    </select>
    <select name="listing_type">
      <option value="">Tous types</option>
      <% types.forEach(t => { %>
        <option value="<%= t %>" <%= filters.listing_type === t ? 'selected' : '' %>><%= t %></option>
      <% }) %>
    </select>
    <select name="status">
      <option value="">Tous statuts</option>
      <% statuses.forEach(s => { %>
        <option value="<%= s %>" <%= filters.status === s ? 'selected' : '' %>><%= s %></option>
      <% }) %>
    </select>
    <button type="submit" class="btn-primary">Filtrer</button>
    <a href="/listings" class="btn-secondary">Réinitialiser</a>
  </form>

  <% if (listings.length === 0) { %>
    <p class="text-muted" style="margin-top:2rem">Aucune annonce ne correspond à votre recherche.</p>
  <% } else { %>
    <div class="listings-grid">
      <% listings.forEach(l => { %>
        <article class="listing-card">
          <% if (l.image_path) { %>
            <img src="<%= l.image_path %>" alt="<%= l.title %>" loading="lazy" class="listing-img">
          <% } else { %>
            <div class="listing-img-placeholder"></div>
          <% } %>
          <div class="listing-body">
            <span class="badge badge-<%= l.listing_type %>"><%= l.listing_type %></span>
            <span class="badge badge-cat"><%= l.category %></span>
            <h2 class="listing-title"><a href="/listings/<%= l.id %>"><%= l.title %></a></h2>
            <p class="listing-meta">
              <%= l.location %> &bull; <%= l.first_name %> <%= l.last_name[0] %>.
              <% if (l.listing_type === 'vente' && l.price != null) { %>
                &bull; <strong><%= l.price.toFixed(2) %> €</strong>
              <% } %>
            </p>
          </div>
        </article>
      <% }) %>
    </div>

    <% if (totalPages > 1) { %>
      <nav class="pagination">
        <% for (let p = 1; p <= totalPages; p++) { %>
          <a href="?page=<%= p %>&category=<%= filters.category || '' %>&listing_type=<%= filters.listing_type || '' %>&status=<%= filters.status || '' %>"
             class="page-link <%= p === currentPage ? 'active' : '' %>"><%= p %></a>
        <% } %>
      </nav>
    <% } %>
  <% } %>
</div>
<%- include('../partials/footer') %>
