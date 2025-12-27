let allRows = [];
let filteredRows = [];
let currentPage = 1;
let rowsPerPage = 10;
let sortState = { key: null, asc: true };

function loadSheet(file, btn) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  fetch(`assets/data/${file}`)
    .then((r) => r.text())
    .then((xml) => {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      allRows = [...doc.getElementsByTagName("row")];
      filteredRows = allRows;
      currentPage = 1;
      renderTable();
    });
}

function renderTable() {
  const thead = document.querySelector("thead");
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  thead.innerHTML = "";

  if (!filteredRows.length) {
    document.getElementById("emptyState").classList.remove("hidden");
    return;
  }
  document.getElementById("emptyState").classList.add("hidden");

  const headers = [...filteredRows[0].children].map((c) => c.tagName);

  thead.innerHTML = `<tr>${headers
    .map(
      (h) => `
      <th onclick="sortBy('${h}')"
        class="px-4 py-2 cursor-pointer font-semibold">
        ${h} ${sortState.key === h ? (sortState.asc ? "▲" : "▼") : ""}
      </th>`
    )
    .join("")}</tr>`;

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = filteredRows.slice(start, start + rowsPerPage);

  pageRows.forEach((row, i) => {
    tbody.innerHTML += `
      <tr onclick="openModal(${start + i})"
          class="hover:bg-blue-100 cursor-pointer">
        ${headers
          .map(
            (h) =>
              `<td class="px-4 py-2">${
                row.getElementsByTagName(h)[0].textContent
              }</td>`
          )
          .join("")}
      </tr>`;
  });

  renderPagination();
}

function searchTable(v) {
  filteredRows = allRows.filter((r) =>
    r.textContent.toLowerCase().includes(v.toLowerCase())
  );
  currentPage = 1;
  renderTable();
}

function sortBy(key) {
  sortState.asc = sortState.key === key ? !sortState.asc : true;
  sortState.key = key;
  filteredRows.sort((a, b) => {
    const A = a.getElementsByTagName(key)[0].textContent;
    const B = b.getElementsByTagName(key)[0].textContent;
    return sortState.asc ? A.localeCompare(B) : B.localeCompare(A);
  });
  renderTable();
}

function renderPagination() {
  const p = document.getElementById("pagination");
  p.innerHTML = "";
  if (rowsPerPage >= filteredRows.length) return;

  const pages = Math.ceil(filteredRows.length / rowsPerPage);
  for (let i = 1; i <= pages; i++) {
    p.innerHTML += `
      <button onclick="currentPage=${i};renderTable()"
        class="px-3 py-1 border rounded ${
          i === currentPage ? "bg-blue-600 text-white" : ""
        }">
        ${i}
      </button>`;
  }
}

function changeRowsPerPage(v) {
  rowsPerPage = v === "all" ? filteredRows.length : Number(v);
  currentPage = 1;
  renderTable();
}

function exportExcel() {
  const data = filteredRows.map((r) => {
    let o = {};
    [...r.children].forEach((c) => (o[c.tagName] = c.textContent));
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet");
  XLSX.writeFile(wb, "export.xlsx");
}

function openModal(i) {
  const r = filteredRows[i];
  document.getElementById("modalContent").innerHTML = [...r.children]
    .map((c) => `<p><b>${c.tagName}</b>: ${c.textContent}</p>`)
    .join("");
  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}
function toggleDark() {
  document.documentElement.classList.toggle("dark");
}

function convertExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: "binary" });
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
      let xml = `<?xml version="1.0"?>\n<records>\n`;
      rows.forEach((r) => {
        xml += "  <row>\n";
        Object.keys(r).forEach((k) => (xml += `    <${k}>${r[k]}</${k}>\n`));
        xml += "  </row>\n";
      });
      xml += "</records>";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([xml], { type: "text/xml" }));
      a.download = `${name}.xml`;
      a.click();
    });
  };
  reader.readAsBinaryString(file);
}

window.onload = () => document.querySelector(".tab-btn").click();
