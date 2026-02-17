const STORAGE_KEY = 'oxy-bmond-issues';

const issueForm = document.getElementById('issue-form');
const issueList = document.getElementById('issueList');
const emptyState = document.getElementById('emptyState');
const committeeModeToggle = document.getElementById('committeeMode');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const issueCardTemplate = document.getElementById('issue-card-template');

let issues = loadIssues();

issueForm.addEventListener('submit', handleIssueSubmit);
committeeModeToggle.addEventListener('change', renderIssues);
statusFilter.addEventListener('change', renderIssues);
searchInput.addEventListener('input', renderIssues);

renderIssues();

function loadIssues() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    return JSON.parse(localData);
  }

  return [
    {
      id: createIssueId(),
      residentName: 'Sample Resident',
      unitNumber: 'A-101',
      contactNumber: '+91 90000 00000',
      category: 'Maintenance',
      issueTitle: 'Lift not working on odd floors',
      issueDescription: 'The right-side lift stops at 3rd floor and does not move further.',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updates: [
        {
          text: 'Complaint received and vendor informed.',
          timestamp: new Date().toISOString()
        }
      ]
    }
  ];
}

function saveIssues() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
}

function handleIssueSubmit(event) {
  event.preventDefault();

  const formData = new FormData(issueForm);
  const newIssue = {
    id: createIssueId(),
    residentName: String(formData.get('residentName')).trim(),
    unitNumber: String(formData.get('unitNumber')).trim(),
    contactNumber: String(formData.get('contactNumber')).trim(),
    category: String(formData.get('category')).trim(),
    issueTitle: String(formData.get('issueTitle')).trim(),
    issueDescription: String(formData.get('issueDescription')).trim(),
    status: 'Open',
    createdAt: new Date().toISOString(),
    updates: []
  };

  issues.unshift(newIssue);
  saveIssues();
  issueForm.reset();
  renderIssues();
}

function renderIssues() {
  issueList.innerHTML = '';

  const isCommitteeMode = committeeModeToggle.checked;
  const selectedStatus = statusFilter.value;
  const query = searchInput.value.toLowerCase().trim();

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;
    const matchesSearch =
      issue.issueTitle.toLowerCase().includes(query) ||
      issue.residentName.toLowerCase().includes(query) ||
      issue.unitNumber.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  emptyState.classList.toggle('hidden', filteredIssues.length > 0);

  filteredIssues.forEach((issue) => {
    const issueCard = createIssueCard(issue, isCommitteeMode);
    issueList.appendChild(issueCard);
  });
}

function createIssueCard(issue, isCommitteeMode) {
  const fragment = issueCardTemplate.content.cloneNode(true);

  const titleEl = fragment.querySelector('.issue-title');
  const metaEl = fragment.querySelector('.issue-meta');
  const descriptionEl = fragment.querySelector('.issue-description');
  const idEl = fragment.querySelector('.issue-id');
  const statusBadgeEl = fragment.querySelector('.status-badge');
  const updatesListEl = fragment.querySelector('.updates-list');
  const committeeFormEl = fragment.querySelector('.committee-form');
  const statusSelectEl = fragment.querySelector('.status-select');
  const updateTextEl = fragment.querySelector('.update-text');

  titleEl.textContent = `${issue.category}: ${issue.issueTitle}`;
  metaEl.textContent = `${issue.residentName} (${issue.unitNumber}) • ${formatDate(issue.createdAt)}`;
  descriptionEl.textContent = issue.issueDescription;
  idEl.textContent = `Issue ID: ${issue.id}`;

  statusBadgeEl.textContent = issue.status;
  statusBadgeEl.classList.add(statusClassName(issue.status));

  if (issue.updates.length === 0) {
    const listItem = document.createElement('li');
    listItem.textContent = 'No committee updates yet.';
    updatesListEl.appendChild(listItem);
  } else {
    issue.updates.forEach((update) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${formatDate(update.timestamp)} — ${update.text}`;
      updatesListEl.appendChild(listItem);
    });
  }

  if (isCommitteeMode) {
    committeeFormEl.classList.remove('hidden');
    statusSelectEl.value = issue.status;

    committeeFormEl.addEventListener('submit', (event) => {
      event.preventDefault();

      const selectedStatus = statusSelectEl.value;
      const updateText = updateTextEl.value.trim();

      issue.status = selectedStatus;
      if (updateText) {
        issue.updates.unshift({
          text: updateText,
          timestamp: new Date().toISOString()
        });
      }

      saveIssues();
      renderIssues();
    });
  }

  return fragment;
}

function statusClassName(status) {
  if (status === 'In Progress') {
    return 'status-in-progress';
  }
  if (status === 'Resolved') {
    return 'status-resolved';
  }
  return 'status-open';
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}

function createIssueId() {
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `OB-${random}`;
}
