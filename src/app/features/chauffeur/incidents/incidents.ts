import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Incident } from '../../../models/incident';

@Component({
  selector: 'app-incidents',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents {
  
  selectedType: string = '';
  incidentTypes = [
    { id: 'panne', label: 'Panne', icon: 'build' },
    { id: 'accident', label: 'Accident', icon: 'minor_crash' },
    { id: 'bouchon', label: 'Embouteillage', icon: 'traffic' },
    { id: 'meteo', label: 'Météo', icon: 'cloudy_filled' },
    { id: 'autre', label: 'Autre', icon: 'more_horiz' }
  ];

  incident: Incident = {
    voyage_id: 1, // Logic would be to pick current voyage
    description: '',
    niveau_gravite: 'MOYEN'
  };

  onSubmit() {
    console.log('Sending incident:', this.incident);
    alert('Signalement envoyé avec succès !');
  }
}
