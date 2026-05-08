
import React from 'react';
import './IssuanceFilters/IssuanceFilters.css';

const IssuanceFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedYear,
  onYearChange,
  availableYears,
}) => {
  return (
    <section 
      className="issuance-filters-panel content-card" 
      role="search" 
      aria-label="Filter issuances"
    >
      <div className="issuance-filters-panel__intro">
        <div>
          <p className="section-eyebrow">Refine search</p>
          <h3 className="section-title">Filter issuances</h3>
        </div>
        <p className="section-copy">
          Use filters to narrow down by category, year, and keywords. Results update instantly.
        </p>
      </div>
      
      <div className="issuance-filters-panel__grid" role="group" aria-label="Filter options">
        <div className="issuance-filters-field issuance-filters-field--search">
          <label 
            className="issuance-filters-field__label" 
            htmlFor="issuance-search"
          >
            Search
          </label>
          <div className="issuance-search-control">
            <span className="issuance-search-control__icon" aria-hidden="true">🔍</span>
            <input
              id="issuance-search"
              type="text"
              className="issuance-search-control__input"
              placeholder="Search title, reference number, or description"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-describedby="search-hint"
            />
          </div>
        </div>

        <div className="issuance-filters-field">
          <label 
            className="issuance-filters-field__label" 
            htmlFor="category-filter"
          >
            Category
          </label>
          <select 
            id="category-filter"
            className="form-select issuance-filters-field__select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            <option value="memorandum">Memorandum</option>
            <option value="policy">Policy</option>
            <option value="advisory">Advisory</option>
          </select>
        </div>

        <div className="issuance-filters-field">
          <label 
            className="issuance-filters-field__label" 
            htmlFor="year-filter"
          >
            Year
          </label>
          <select 
            id="year-filter"
            className="form-select issuance-filters-field__select"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            aria-label="Filter by year"
          >
            <option value="all">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="issuance-filters-field">
          <label 
            className="issuance-filters-field__label" 
            htmlFor="type-filter"
          >
            Type
          </label>
          <select 
            id="type-filter"
            className="form-select issuance-filters-field__select"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="division">Division</option>
            <option value="regional">Regional</option>
            <option value="national">National</option>
          </select>
        </div>
      </div>

      <div 
        className="issuance-filters-panel__note" 
        id="search-hint"
        role="note"
      >
        <span className="issuance-filters-panel__note-label">Tip</span>
        <p>Results are updated in real-time as you type or select filters. Use the search for reference numbers like "DM-2026-015".</p>
      </div>
    </section>
  );
};

export default IssuanceFilters;

