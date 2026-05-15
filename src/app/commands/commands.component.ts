import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Component, OnInit} from '@angular/core';

interface CommandEntry {
    title: string;
    command: string;
}

@Component({
    selector: 'app-commands',
    templateUrl: './commands.component.html',
    styleUrls: ['./commands.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class CommandsComponent implements OnInit {
    commands: CommandEntry[] = [];
    copiedCommand: CommandEntry | null = null;
    loadError = false;

    constructor(private http: HttpClient) {
    }

    ngOnInit() {
        this.http.get<CommandEntry[]>('/assets/commands.json').subscribe({
            next: commands => {
                this.commands = commands;
                this.loadError = false;
            },
            error: () => {
                this.commands = [];
                this.loadError = true;
            }
        });
    }

    async copyCommand(command: CommandEntry) {
        try {
            await navigator.clipboard.writeText(command.command);
            this.copiedCommand = command;
            window.setTimeout(() => {
                if (this.copiedCommand === command) {
                    this.copiedCommand = null;
                }
            }, 3000);
        } catch {
            this.copiedCommand = null;
        }
    }
}
