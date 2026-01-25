// utils.js
// Shared utility functions for case_detail module.
// Exposed on window for backward compatibility.

export function getRoleText(role) {
    return role === 'offender' ? '피의자 (가해자)' : '피해자';
}

export function getStatusText(status) {
    switch (status) {
        case 'connected': return '연결 완료';
        case 'pending': return '수락 대기';
        case 'invited': return '가입 대기';
        case 'negotiating': return '협의 중';
        case 'completed': return '합의 완료';
        default: return '대기 중';
    }
}

export function getIconClass(condition) {
    return condition ? 'fas fa-check-circle' : 'far fa-circle';
}

export function getColor(condition) {
    return condition ? 'var(--secondary)' : 'var(--text-muted)';
}

export function getOpacity(condition) {
    return condition ? '1' : '0.5';
}

// Backward compatibility (old global functions)
window.getRoleText = getRoleText;
window.getStatusText = getStatusText;
window.getIconClass = getIconClass;
window.getColor = getColor;
window.getOpacity = getOpacity;
