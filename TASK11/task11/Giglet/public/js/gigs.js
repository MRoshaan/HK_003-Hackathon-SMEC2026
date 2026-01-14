document.addEventListener('DOMContentLoaded', () => {
    const gigsContainer = document.getElementById('gigs-container');
    const postGigForm = document.getElementById('post-gig-form');

    if (gigsContainer) {
        fetchGigs();
    }

    async function fetchGigs() {
        try {
            const res = await fetch('/api/gigs');
            const gigs = await res.json();
            
            gigsContainer.innerHTML = gigs.map(gig => `
                <div class="card gig-card">
                    <div class="header">
                        <span class="status-badge status-${gig.status.replace(' ', '-')}">${gig.status}</span>
                        <span class="budget">PKR ${gig.budget}</span>
                    </div>
                    <h3>${gig.title}</h3>
                    <div class="footer">
                        <span>Due ${gig.deadline}</span>
                        <a href="gig_details.html?id=${gig.id}" class="btn btn-outline btn-sm">View Details</a>
                    </div>
                </div>
            `).join('');
        } catch (err) {
        }
    }

    if (postGigForm) {
        postGigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(postGigForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/gigs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    window.location.href = '/dashboard.html';
                }
            } catch (err) {
            }
        });
    }
});

async function placeBid(gigId) {
    const amountInput = document.getElementById(`bid-amount-${gigId}`);
    const amount = amountInput.value;
    
    if (!amount) return;

    try {
        const res = await fetch(`/api/gigs/${gigId}/bids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        
        if (res.ok) {
            amountInput.value = '';
        }
    } catch (err) {
    }
}
window.placeBid = placeBid;
