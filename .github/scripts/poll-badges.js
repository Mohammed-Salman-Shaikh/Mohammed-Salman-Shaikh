// Builds one SVG badge per rating option from the vote issues.
// A vote is an issue whose title is exactly "Portfolio rating: <option>".
// Used by .github/workflows/poll.yml via actions/github-script.
const fs = require('fs');
const path = require('path');

const OPTIONS = [
  { key: 'Great', label: 'Great', color: '#e05d44', file: 'great.svg' },
  { key: 'Good', label: 'Good', color: '#2ea44f', file: 'good.svg' },
  { key: 'Needs work', label: 'Needs work', color: '#0969da', file: 'needs-work.svg' },
];

function badge(label, count, color) {
  const text = `${count} vote${count === 1 ? '' : 's'}`;
  const charW = 7.2;
  const lw = Math.round(label.length * charW + 24);
  const rw = Math.round(text.length * charW + 24);
  const w = lw + rw;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28" role="img" aria-label="${esc(label)}: ${text}">
<title>${esc(label)}: ${text}</title>
<rect width="${lw}" height="28" fill="#555"/>
<rect x="${lw}" width="${rw}" height="28" fill="${color}"/>
<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="12" font-weight="bold" text-anchor="middle">
<text x="${lw / 2}" y="18.5">${esc(label)}</text>
<text x="${lw + rw / 2}" y="18.5">${text}</text>
</g>
</svg>
`;
}

function countVotes(issues) {
  const counts = Object.fromEntries(OPTIONS.map((o) => [o.key, 0]));
  for (const issue of issues) {
    if (issue.pull_request) continue;
    const m = /^Portfolio rating:\s*(.+?)\s*$/i.exec(issue.title || '');
    if (!m) continue;
    const opt = OPTIONS.find((o) => o.key.toLowerCase() === m[1].toLowerCase());
    if (opt) counts[opt.key] += 1;
  }
  return counts;
}

function writeBadges(counts, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const o of OPTIONS) {
    fs.writeFileSync(path.join(outDir, o.file), badge(o.label, counts[o.key], o.color));
  }
}

module.exports = async ({ github, context }) => {
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'all',
    per_page: 100,
  });
  const counts = countVotes(issues);
  console.log('Vote counts:', counts);
  writeBadges(counts, 'poll');
};

module.exports.countVotes = countVotes;
module.exports.writeBadges = writeBadges;
