async function acceptBid(bidId) {
    try {
        const res = await fetch(`/api/bids/${bidId}/accept`, {
            method: 'POST'
        });
        
        if (res.ok) {
            location.reload();
        }
    } catch (err) {
    }
}
window.acceptBid = acceptBid;
