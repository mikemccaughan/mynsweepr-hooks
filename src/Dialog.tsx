import EventEmitter from 'events';
import React, {
    PropsWithChildren,
    useState,
} from 'react';
import {Logger} from './Logger';

export type DIALOG_ELEMENT_NAME = "Dialog";

export type DialogType = React.ReactElement<DialogProps, DIALOG_ELEMENT_NAME> & {isOpen?:boolean;}

export class DialogManager {
    [key: string | symbol]: unknown;
    dialogs: Map<string, DialogType>;
    dialogStates: Map<string, boolean>;
    onStateChange: EventEmitter;
    constructor() {
        this.dialogs = new Map<string, DialogType>();
        this.dialogStates = new Map<string, boolean>();
        this.onStateChange = new EventEmitter();
    }
    static #instance: DialogManager;
    static get instance(): DialogManager {
        if (this.#instance) {
            return this.#instance;
        }
        return this.#instance = new Proxy(new DialogManager(), DialogManager.indexer);
    }
    private static indexer: ProxyHandler<DialogManager> = {
        get(target: DialogManager, property: string): boolean | unknown {
            if (target.dialogStates.has(property)) {
                const value = target.dialogStates.get(property);
                Logger.trace(`ProxyHandler for DialogManager: get "${property}" from dialogStates: ${value}`);
                return value;
            } else {
                return target[property];
            }
        },
        set(target: DialogManager, property: string, value: boolean | unknown): boolean {
            if (target.dialogStates.has(property)) {
                Logger.trace(`ProxyHandler for DialogManager: set "${property}" in dialogStates: ${!!value}`);
                target.dialogStates.set(property, !!value);
                target.onStateChange.emit(property, value as boolean);
            } else {
                target[property] = !!value;
            }
            return true;
        }
    }
    register(dialog: DialogType): void {
        Logger.trace(`DialogManager: register: dialog: ${JSON.stringify(dialog.props.id)}`);
        const dialogId = dialog.props.id;
        if (!this.isRegistered(dialogId)) {
            Logger.trace(`DialogManager: register: dialog: ${JSON.stringify(dialog.props.id)} not registered`);
            const dialogIsOpen = dialog.props.isOpen ?? this.dialogStates.get(dialogId) ?? false;
            this.dialogs.set(dialogId, dialog);
            // Initial value does not trigger state change event
            this.dialogStates.set(dialogId, dialogIsOpen);    
        }
    }
    isRegistered(dialogOrId: string | DialogType): boolean {
        const { id } = this.getDialogAndIdFromDialogOrId(dialogOrId);
        if (id) {
            return this.dialogs.has(id) && this.dialogStates.has(id);
        }
        return false;
    }
    getDialogAndIdFromDialogOrId(dialogOrId: string | DialogType): { id?: string; dialog?: DialogType; } {
        let dialogId: string | undefined;
        let dialog = dialogOrId as DialogType | undefined;
        if (typeof dialogOrId === 'string') {
            dialogId = dialogOrId as string;
            dialog = this.dialogs.get(dialogId);
        } else {
            dialogId = dialog?.props.id;
        }
        return {
            id: dialogId,
            dialog
        };
    }
    open(dialogOrId: string | DialogType): void {
        const { id, dialog } = this.getDialogAndIdFromDialogOrId(dialogOrId);
        if (typeof dialog === 'undefined') {
            throw Error(`The dialog "${id}" was not found or was not registered with the DialogManager`);
        } else if (typeof id === 'string' && id.length > 0) {
            Logger.trace(`DialogManager: open: dialogOrId: ${JSON.stringify(dialogOrId)}`);
            for (const [mid] of this.dialogs.entries()) {
                if (mid !== id) {
                    this.close(mid);
                }
            }
            this[id] = true;
        }
    }
    close(dialogOrId: string | DialogType): void {
        const { id, dialog } = this.getDialogAndIdFromDialogOrId(dialogOrId);
        if (typeof dialog === 'undefined') {
            throw Error(`The dialog "${id}" was not found or was not registered with the DialogManager`);
        } else {
            Logger.trace(`DialogManager: close: dialogOrId: ${JSON.stringify(dialogOrId)}`);
            if (typeof id === 'string' && id.length > 0) {
                this[id] = false;
            } else {
                throw Error(`Could not get id of the dialog specified`);
            }
        }
    }
}

export interface DialogProps extends PropsWithChildren {
    id: string;
    isOpen: boolean;
}

export const Dialog: React.FC<DialogProps> = (props: DialogProps) => {
    if (typeof props?.id !== 'string' || props?.id?.length === 0) {
        throw Error('id must be a valid string of greater than zero length');
    }
    const [id] = useState(props.id);
    const [isOpen, setIsOpen] = useState(props.isOpen ?? false);
    const setStateOnChange = (value: boolean) => setIsOpen(value);
    DialogManager.instance.onStateChange.removeAllListeners(id).on(id, setStateOnChange);
    const me = (
        <dialog open={isOpen} id={id}>
            {props.children}
        </dialog>
    );

    DialogManager.instance.register(me);
    return me;
};