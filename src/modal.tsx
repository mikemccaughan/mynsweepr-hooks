import { useRef, DetailedHTMLProps, DOMAttributes, ReactEventHandler, SyntheticEvent, FC, ReactElement } from "react"
import { Utils } from "./Utils";

export interface IModalProps {
    id: string;
    title: string;
    result: unknown;
    onClose: (e: Event) => void;
    onAccept: (e: Event) => void;
    onCancel: (e: Event) => void;
}

const Modal: FC<IModalProps & DetailedHTMLProps<DOMAttributes<HTMLElement>, HTMLElement>> = ({ 
    id, 
    title, 
    result, 
    onClose, 
    onAccept, 
    onCancel, 
    children 
}: IModalProps & DetailedHTMLProps<DOMAttributes<HTMLElement>, HTMLElement>) => {
    const dialogRef = useRef(null);
    const handleAccept: ReactEventHandler<HTMLButtonElement> = (e: SyntheticEvent) => {
        if (typeof onAccept === 'function') { 
            const evt = new CustomEvent(
                'hm.dialog.accept', 
                { 
                    detail: result,
                    ...e
                }
            ); 
            onAccept(evt); 
        } 
    };
    const handleCancel: ReactEventHandler<HTMLButtonElement> = (e: SyntheticEvent) => {
        if (typeof onCancel === 'function') {
            const evt = new CustomEvent(
                'hm.dialog.cancel',
                {
                    detail: { canceled: true },
                    ...e
                }
            );
            onCancel(evt);
        } 
    };
    const handleClose: ReactEventHandler<HTMLButtonElement> = (e: SyntheticEvent) => { 
        if (typeof onClose === 'function') 
        { 
            const evt = new CustomEvent(
                'hm.dialog.accept', 
                { 
                    detail: result,
                    ...e
                }
            ); 
            onClose(evt);
        }
    };


    return <dialog id={id} aria-modal="true" aria-live="assertive" className="dialog dialog-modal" ref={dialogRef}>
        <header>
            <h1>{title}</h1>
            <button type="button" className="dialog-close" onClick={handleClose}>✖</button>
        </header>
        <section>
            {children}
        </section>
        <footer>
            <button type="button" className="dialog-okay" onClick={handleAccept}>OK</button>
            <button type="button" className="dialog-cancel" onClick={handleCancel}>Cancel</button>
        </footer>
    </dialog>;
};

export class ModalManager {

    modals: Record<string, typeof Modal>;
    modalStates: Record<string, boolean>;

    constructor() {
        this.modals = {};
        this.modalStates = {};
    }
    private static _instance: ModalManager;
    public static get instance(): ModalManager {
        if (Utils.isGood(ModalManager._instance)) {
            return ModalManager._instance;
        }
        return ModalManager._instance = new ModalManager();
    }
    public register(id: string, modal: typeof Modal): void {
        if (!Utils.isGoodString(id)) {
            throw new TypeError(`id must be a valid string to be useful; got ${id}`);
        }
        if (Utils.isGood(this.modals[id])) {
            if (this.modals[id] !== modal) {
                console.warn(`A modal with the id "${id}" was already registered and is not the same instance. The manager will replace the former instance with the new one.`);
            } else {
                console.warn(`The modal with the id "${id}" was already registered.`);
                return;
            }
        }
        this.modals[id] = modal;
        this.modalStates[id] = false;

    }
    public open(id: string): typeof Modal {
        this.modalStates[id] = true;
        this.modals[id].defaultProps?.ref
        return this.modals[id];
    }
}

export default Modal;