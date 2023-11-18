import React, { useState } from 'react';

interface ActionButtonType {
    title: string
    action: () => Promise<void>
    enabled?: boolean
}

export function ActionButton({ title, action, enabled = true }: ActionButtonType) {

    const [disabled, setDisabled] = useState(!enabled)

    const onClick = () => {
        setDisabled(true);
        action()
            .finally(() => setDisabled(false))
    }

    return <button
        disabled={disabled}
        onClick={onClick}>
        {title}
    </button>
}