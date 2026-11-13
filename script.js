/* Librivanta - Library Book Record System */
// STORAGE CONFIGURATION: Keys used to save book records and the user profile in localStorage.
const STORAGE_KEY = "librivanta_book_record_system_v5";
const PROFILE_KEY = "librivanta_user_profile_v2";

// DEFAULT BOOK DATA: Sample records shown when no saved book collection exists yet.
const DEFAULT_BOOKS = [
    {
        id: "BK-101", 
        title: "To Kill a Mockingbird", 
        author: "Harper Lee", 
        genre: "Fiction", 
        copies: 5 
    },
    { 
        id: "BK-102", 
        title: "Clean Code", 
        author: "Robert C. Martin", 
        genre: "Programming", 
        copies: 4 
    },
    { 
        id: "BK-103", 
        title: "The Great Gatsby", 
        author: "F. Scott Fitzgerald", 
        genre: "Fiction", 
        copies: 3 
    },
    { 
        id: "BK-104", 
        title: "A Brief History of Time", 
        author: "Stephen Hawking", 
        genre: "Science", 
        copies: 4 
    },
    { 
        id: "BK-105", 
        title: "Atomic Habits", 
        author: "James Clear", 
        genre: "Education", 
        copies: 6 
    },
    { 
        id: "BK-106", 
        title: "Sapiens: A Brief History of Humankind", 
        author: "Yuval Noah Harari", 
        genre: "History", 
        copies: 3 
    }
];

// DEFAULT PROFILE: Initial librarian information used when no profile has been saved.
const DEFAULT_PROFILE = { 
    name: "Igniters", 
    id: "LIB-USR-2026", 
    role: "Chief Librarian & System Admin", 
    email: "librarian@librivanta.edu" 
};

// APPLICATION STATE: Load saved book data and profile details when the script starts.
let data = loadBooks();
let userProfile = loadProfile();

// LOAD BOOKS: Read saved records from localStorage; use default records if unavailable.
function loadBooks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.books)) 
            return { 
                books: saved.books.map(book => ({ ...book, copies: Number(book.copies) || 1 })) 
            };
    } 
    catch (error) { 
        console.warn("Could not load saved books.", error); 
    }
    return {
        books: DEFAULT_BOOKS.map(book => ({ ...book })) 
    };
}

// LOAD PROFILE: Restore the saved user profile and fill missing fields with defaults.
function loadProfile() {
    try {
        return { ...DEFAULT_PROFILE, ...(JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}) 
    }; 
}
    catch {
         return { ...DEFAULT_PROFILE }; 
        }
}

// SAVE BOOK DATA: Convert the current book data to JSON and store it in the browser.
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
}

// SAVE PROFILE: Store the current user profile in localStorage.
function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile)); 
}

// HTML SAFETY: Escape special characters before placing user-provided text into HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// TOAST NOTIFICATION: Display a short status message and hide it after a delay.
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// FIND BOOK: Return the record matching a book ID, ignoring case and extra spaces.
function getBook(bookId) {
     return data.books.find(book => String(book.id).trim().toLowerCase() === String(bookId).trim().toLowerCase()); 
    }

// AUTO-GENERATE ID: Find the highest numeric book ID and create the next ID.
function generateNextBookId() {
    const maxId = data.books.reduce((max, book) => {
        const match = String(book.id || "").match(/^(?:BK-|B)?(\d+)$/i);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 100);
    return `BK-${maxId + 1}`;
}

// CALCULATE TOTALS: Count book titles, total copies, and unique authors.
function calculateTotals() {
    return {
        titles: data.books.length,
        copies: data.books.reduce((sum, book) => sum + (Number(book.copies) || 0), 0),
        authors: new Set(data.books.map(book => String(book.author || "").trim().toLowerCase()).filter(Boolean)).size
    };
}

// UPDATE STATISTICS: Display calculated totals in the dashboard and profile summary.
function updateStatistics() {
    const totals = calculateTotals();
    const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
    setText("availableBooksStat", totals.copies);
    setText("totalTitlesStat", totals.titles);
    setText("totalBooksStat", totals.copies);
    setText("totalAuthorsStat", totals.authors);
    setText("profileStatBooks", totals.titles);
    setText("profileStatAuthors", totals.authors);
}

// GENRE FILTER OPTIONS: Build the genre dropdown from genres currently in the collection.
function renderBookGenreFilter() {
    const select = document.getElementById("bookGenreFilter");
    if (!select) return;
    const selected = select.value;
    const genres = [...new Set(data.books.map(book => book.genre).filter(Boolean))].sort();
    select.innerHTML = `<option value="">All Genres</option>${genres.map(genre => `<option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>`).join("")}`;
    select.value = genres.includes(selected) ? selected : "";
}

// RENDER BOOK RECORDS: Apply search and genre filters, then rebuild the records table.
function renderBookRecords() {
    renderBookGenreFilter();
    const query = (document.getElementById("bookSearchInput")?.value || "").trim().toLowerCase();
    const genre = document.getElementById("bookGenreFilter")?.value || "";
    const filtered = data.books.filter(book => {
        const searchable = [book.id, book.title, book.author].some(value => String(value || "").toLowerCase().includes(query));
        return searchable && (!genre || book.genre === genre);
    });

    const count = document.getElementById("bookSearchCount");
    if (count) count.textContent = query ? `Found ${filtered.length} of ${data.books.length} books` : `Showing ${filtered.length} records`;
    document.getElementById("clearBookSearch")?.classList.toggle("hidden", !query);
    const tbody = document.getElementById("booksTableBody");
    const empty = document.getElementById("booksEmptyState");
    const heading = document.getElementById("emptyHeading");
    const message = document.getElementById("emptyMsg");
    if (!tbody || !empty) return;
    tbody.innerHTML = filtered.map((book, index) => `
        <tr>
            <td class="col-sl">
                ${index + 1}
            </td>
            <td>
                <span class="book-id-badge clickable-id" onclick="openEditBookModal('${escapeHTML(book.id)}')" title="Edit book ID and details">
                    ${escapeHTML(book.id)} 
                    <i class="fa-solid fa-pen" style="font-size:9px;opacity:.7"></i>
                </span>
            </td>
            <td>
                <div class="book-title-cell">
                    <i class="fa-solid fa-book book-icon"></i>
                    <div><strong>${escapeHTML(book.title)}</strong></div>
                </div>
            </td>
            <td>
                <div class="author-cell">
                    <i class="fa-solid fa-user-pen author-icon"></i>
                    <span>${escapeHTML(book.author)}</span>
                </div>
            </td>
            <td>
                <span class="genre-badge">
                    ${escapeHTML(book.genre || "General")}
                </span>
            </td>
            <td style="font-weight:700;color:#374151">
                ${Number(book.copies) || 0}
            </td>
            <td>
                <span class="available-badge available-in-stock">
                    <i class="fa-solid fa-check"></i> 
                    ${Number(book.copies) || 0} 
                    Available
                </span>
            </td>
            <td style="text-align:center">
                <div class="action-btn-group">
                    <button type="button" class="action-edit-btn" onclick="openEditBookModal('${escapeHTML(book.id)}')" title="Edit book details">
                        <i class="fa-solid fa-pen-to-square"></i> 
                        Edit
                    </button>
                    <button type="button" class="action-delete-btn" data-delete-book="${escapeHTML(book.id)}" title="Delete book record">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>`
    ).join("");
    empty.classList.toggle("hidden", filtered.length > 0);
    if (!filtered.length) {
        if (heading) heading.textContent = query ? "No Matching Books Found" : "No Book Records Found";
        if (message) message.textContent = query ? `No books match "${query}". Try another ID, author, or title.` : "Your library collection is empty. Add a new book record to begin.";
        document.getElementById("emptyClearSearchBtn")?.classList.toggle("hidden", !query);
    }
}

// DASHBOARD RECENT BOOKS: Show the latest five book records on the dashboard.
function renderDashboardBooks() {
    const container = document.getElementById("dashboardBookList");
    if (!container) 
        return;
    if (!data.books.length) { 
        container.innerHTML = 
            '<div class="empty-state">No books added yet. Click “Add New Book” to get started.</div>';
            return; 
        }
    container.innerHTML = data.books.slice(-5).reverse().map(book => `
        <div class="record-row"><div><strong>${escapeHTML(book.title)}</strong><small>${escapeHTML(book.id)} · ${escapeHTML(book.author)}</small></div><span class="pill">${Number(book.copies) || 0} copies</span></div>`).join("");
}

// DASHBOARD AUTHORS: Display a list of unique authors and their title counts.
function renderDashboardAuthors() {
    const container = document.getElementById("dashboardAuthorList");
    if (!container) return;
    const authors = [...new Map(data.books.map(book => [String(book.author || "").trim().toLowerCase(), String(book.author || "").trim()]).filter(([key, name]) => key && name)).values()].sort((a, b) => a.localeCompare(b));
    container.innerHTML = authors.length ? authors.slice(0, 8).map(author => {
        const count = data.books.filter(book => String(book.author || "").trim().toLowerCase() === author.toLowerCase()).length;
        return `<div class="record-row"><div><strong>${escapeHTML(author)}</strong><small>${count} book title${count === 1 ? "" : "s"}</small></div>
        <i class="fa-solid fa-user-pen author-icon"></i>
        </div>`;
    }
).join("") : '<div class="empty-state">No authors in the collection yet.</div>';
}

// REFRESH UI: Update statistics, book lists, author lists, and profile information together.
function refreshEverything() { 
    updateStatistics(); 
    renderBookRecords(); 
    renderDashboardBooks(); 
    renderDashboardAuthors(); 
    renderUserProfile(); 
}

// PAGE NAVIGATION: Activate the requested page and highlight its navigation item.
function openPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("active-page", page.id === pageId));
    // SIDEBAR NAVIGATION: Open the page selected by a sidebar navigation button.
document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === pageId));
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.page === "add-book") openAddBookPage(); else openPage(button.dataset.page);
}));

// INLINE PAGE LINKS: Let dashboard buttons navigate to the page named in data-page-link.
document.querySelectorAll("[data-page-link]").forEach(button => button.addEventListener("click", () => openPage(button.dataset.pageLink)));
// OPEN ADD BOOK PAGE: Reset the form, prepare a new ID, and focus the title field.
function openAddBookPage() {
    document.getElementById("bookForm")?.reset();
    const idInput = document.getElementById("bookIdInput");
    if (idInput) idInput.value = generateNextBookId();
    const status = document.getElementById("bookIdStatusMsg");
    if (status) { status.textContent = "Type a custom Book ID or click Auto ID to generate one."; status.style.color = "#777"; }
    openPage("add-book");
    setTimeout(() => document.getElementById("bookTitleInput")?.focus(), 100);
}

// CLOSE ADD BOOK PAGE: Return to the Book Records page.
function closeAddBookPage() { openPage("book-records"); }
document.getElementById("openAddBookPage")?.addEventListener("click", openAddBookPage);
document.getElementById("topbarAddBookBtn")?.addEventListener("click", openAddBookPage);
document.getElementById("heroAddBookBtn")?.addEventListener("click", openAddBookPage);
document.getElementById("emptyAddBookBtn")?.addEventListener("click", openAddBookPage);
document.getElementById("cancelAddBookBtn")?.addEventListener("click", closeAddBookPage);
// AUTO ID BUTTON: Generate an ID and show a confirmation message beside the field.
document.getElementById("autoGenerateBookIdBtn")?.addEventListener("click", () => {
    const input = document.getElementById("bookIdInput");
    if (input) input.value = generateNextBookId();
    const status = document.getElementById("bookIdStatusMsg");
    if (status) { status.textContent = `Generated unique Book ID: ${input.value}`; status.style.color = "#15803d"; }
});

// BOOK ID VALIDATION: Check whether the typed ID already belongs to a book record.
document.getElementById("bookIdInput")?.addEventListener("input", event => {
    const existing = getBook(event.target.value.trim());
    const status = document.getElementById("bookIdStatusMsg");
    if (!status) return;
    status.textContent = existing ? `This ID already belongs to “${existing.title}”. Saving will add copies to that record.` : "Book ID is available.";
    status.style.color = existing ? "#d97706" : "#15803d";
});

// ADD BOOK FORM: Validate input, add a new record or increase copies, then save and refresh.
document.getElementById("bookForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const title = document.getElementById("bookTitleInput").value.trim();
    const author = document.getElementById("bookAuthorInput").value.trim();
    const id = document.getElementById("bookIdInput").value.trim();
    const genre = document.getElementById("bookGenreSelect").value;
    const copies = Math.max(1, Number.parseInt(document.getElementById("bookCopiesInput").value, 10) || 1);
    if (!title || !author || !id || !genre) { showToast("Please fill in all book details."); return; }
    const existing = getBook(id);
    if (existing) {
        if (existing.title.toLowerCase() !== title.toLowerCase() || existing.author.toLowerCase() !== author.toLowerCase()) { showToast("This Book ID already belongs to a different book."); return; }
        existing.copies = (Number(existing.copies) || 0) + copies;
        existing.genre = genre;
        showToast(`Added ${copies} copies to “${existing.title}”.`);
    } else {
        data.books.push({ id, title, author, genre, copies });
        showToast(`Book “${title}” added successfully.`);
    }
    saveData(); // INITIAL RENDER: Populate all dashboard, table, and profile information on page load.
refreshEverything(); openPage("book-records");
});

// BOOK SEARCH AND FILTER: Refresh the table whenever the search or genre selection changes.
document.getElementById("bookSearchInput")?.addEventListener("input", renderBookRecords);
document.getElementById("bookGenreFilter")?.addEventListener("change", renderBookRecords);
// CLEAR SEARCH: Empty the search field, refresh results, and return focus to the input.
function clearBookSearch() {
    const input = document.getElementById("bookSearchInput");
    if (input) input.value = "";
    renderBookRecords();
    input?.focus();
}

document.getElementById("clearBookSearch")?.addEventListener("click", clearBookSearch);
document.getElementById("emptyClearSearchBtn")?.addEventListener("click", clearBookSearch);
// GLOBAL SEARCH: Copy the top-bar query into the Book Records search and show that page.
document.getElementById("globalSearch")?.addEventListener("input", event => {
    const input = document.getElementById("bookSearchInput");
    if (input) input.value = event.target.value;
    openPage("book-records"); renderBookRecords();
});

// DELETE BOOK HANDLER: Handle delete clicks from the table and ask for confirmation first.
document.getElementById("booksTableBody")?.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-book]");
    if (!button) return;
    const book = getBook(button.dataset.deleteBook);
    if (!book || !confirm(`Are you sure you want to delete “${book.title}” (${book.id})?`)) return;
    data.books = data.books.filter(item => item.id.toLowerCase() !== book.id.toLowerCase());
    saveData(); refreshEverything(); showToast(`“${book.title}” deleted successfully.`);
});

// OPEN EDIT MODAL: Fill the edit form with the selected book record.
function openEditBookModal(bookId) {
    const book = getBook(bookId);
    if (!book) return;
    document.getElementById("editOriginalBookId").value = book.id;
    document.getElementById("editBookIdInput").value = book.id;
    document.getElementById("editBookTitleInput").value = book.title;
    document.getElementById("editBookAuthorInput").value = book.author;
    document.getElementById("editBookGenreSelect").value = book.genre || "Other";
    document.getElementById("editBookCopiesInput").value = book.copies;
    document.getElementById("editBookModal").classList.remove("hidden");
}

window.openEditBookModal = openEditBookModal;
// CLOSE EDIT MODAL: Hide the book-editing dialog.
function closeEditBookModal() { document.getElementById("editBookModal")?.classList.add("hidden"); }
window.closeEditBookModal = closeEditBookModal;
document.getElementById("closeEditBookModal")?.addEventListener("click", closeEditBookModal);
document.getElementById("editBookModal")?.addEventListener("click", event => { if (event.target.id === "editBookModal") closeEditBookModal(); });
// EDIT BOOK FORM: Validate changes, prevent duplicate IDs, save the updated record, and refresh.
document.getElementById("editBookForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const originalId = document.getElementById("editOriginalBookId").value;
    const newId = document.getElementById("editBookIdInput").value.trim();
    const title = document.getElementById("editBookTitleInput").value.trim();
    const author = document.getElementById("editBookAuthorInput").value.trim();
    const genre = document.getElementById("editBookGenreSelect").value;
    const copies = Math.max(1, Number.parseInt(document.getElementById("editBookCopiesInput").value, 10) || 1);
    if (!newId || !title || !author || !genre) { showToast("Please complete all book fields."); return; }
    const conflict = data.books.find(book => book.id.toLowerCase() === newId.toLowerCase() && book.id.toLowerCase() !== originalId.toLowerCase());
    if (conflict) { showToast("That Book ID is already in use."); return; }
    const book = getBook(originalId);
    if (!book) return;
    Object.assign(book, { id: newId, title, author, genre, copies });
    saveData(); closeEditBookModal(); refreshEverything(); showToast("Book record updated successfully.");
});

// RENDER USER PROFILE: Show current profile details in the top bar and profile form.
function renderUserProfile() {
    const name = document.getElementById("topbarProfileName");
    const id = document.getElementById("topbarProfileIdText");
    const heading = document.getElementById("modalProfileHeading");
    const idDisplay = document.getElementById("profileIdDisplay");
    if (name) name.textContent = userProfile.name;
    if (id) id.textContent = userProfile.id;
    if (heading) heading.textContent = `${userProfile.name} Profile`;
    if (idDisplay) idDisplay.textContent = userProfile.id;
    const values = { profileNameInput: userProfile.name, profileIdInput: userProfile.id, profileRoleInput: userProfile.role, profileEmailInput: userProfile.email };
    Object.entries(values).forEach(([elementId, value]) => { const element = document.getElementById(elementId); if (element) element.value = value || ""; });
}

// PROFILE MODAL CONTROLS: Refresh profile values and show or hide the profile dialog.
function openUserProfile() { renderUserProfile(); document.getElementById("userProfileModal")?.classList.remove("hidden"); }
function closeUserProfile() { document.getElementById("userProfileModal")?.classList.add("hidden"); }
document.getElementById("openUserProfileBtn")?.addEventListener("click", openUserProfile);
document.getElementById("closeUserProfileModal")?.addEventListener("click", closeUserProfile);
document.getElementById("cancelProfileBtn")?.addEventListener("click", closeUserProfile);
document.getElementById("userProfileModal")?.addEventListener("click", event => { if (event.target.id === "userProfileModal") closeUserProfile(); });
// RESET PROFILE ID: Generate a fresh profile ID using the current timestamp.
document.getElementById("resetProfileIdBtn")?.addEventListener("click", () => { document.getElementById("profileIdInput").value = `LIB-USR-${Date.now().toString().slice(-6)}`; });
// COPY PROFILE ID: Copy the profile ID to the clipboard when browser permission allows it.
document.getElementById("copyProfileIdBtn")?.addEventListener("click", async () => {
    const id = document.getElementById("profileIdInput")?.value || userProfile.id;
    try { await navigator.clipboard.writeText(id); showToast("Profile ID copied."); } catch { showToast(`Profile ID: ${id}`); }
});

// SAVE PROFILE FORM: Validate and save the librarian details, then update the interface.
document.getElementById("userProfileForm")?.addEventListener("submit", event => {
    event.preventDefault();
    userProfile = {
        name: document.getElementById("profileNameInput").value.trim(),
        id: document.getElementById("profileIdInput").value.trim(),
        role: document.getElementById("profileRoleInput").value.trim(),
        email: document.getElementById("profileEmailInput").value.trim()
    };
    if (!userProfile.name || !userProfile.id) { showToast("Name and Profile ID are required."); return; }
    saveProfile(); renderUserProfile(); closeUserProfile(); showToast("Profile updated successfully.");
});

refreshEverything();
