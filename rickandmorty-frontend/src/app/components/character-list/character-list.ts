import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Observable, switchMap, map, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { ApiResponse, Character } from '../../models/character.models';

import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

interface CharacterPageData {
  response: ApiResponse;
  currentPage: number;
  searchTerm: string;
}

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './character-list.html',
  styleUrls: ['./character-list.css']
})
export class CharacterListComponent implements OnInit {
  data$!: Observable<CharacterPageData>;
  isSearchVisible = false;
  searchControl = new FormControl('');

  constructor(
    private characterService: CharacterService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.searchControl.valueChanges
    .pipe(
      debounceTime(400),
      distinctUntilChanged()
    )
    .subscribe(v => {
      this.router.navigate(
        ['/character'],
        {
          queryParams: { search: v || null, page: 1 },
          queryParamsHandling: 'merge'
        }
      );
    });

  this.data$ = this.route.queryParamMap.pipe(
    switchMap(p => {
      const page = Number(p.get('page')) || 1;
      const search = p.get('search') || '';

      if (search) {
        this.isSearchVisible = true;
        this.searchControl.setValue(search, { emitEvent: false });
      }

      return this.characterService.getAllCharacters(page, search).pipe(
        map(r => ({
          response: r,
          currentPage: page,
          searchTerm: search
        }))
      );
    })
  );
}

toggleSearch() {
  this.isSearchVisible = !this.isSearchVisible;

  if (!this.isSearchVisible && this.searchControl.value) {
    this.searchControl.setValue('');
  }
}

  public onDownloadPDF(character: Character): void {
    Swal.fire({
      title: `Descargar Ficha de ${character.name}?`,
      text: "Se generará un PDF.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#55cc44', cancelButtonColor: '#d63d2e',
      confirmButtonText: 'Descargar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await this.generateFinalPDF(character);
          Swal.fire('¡Excelente!', `La ficha de ${character.name} se ha generado.`, 'success');
        } catch (error) {
          console.error("Error al generar PDF:", error);
          Swal.fire('¡Error!', 'No se pudo generar la ficha. Revisa la consola.', 'error');
        }
      }
    });
  }

  // Función para Generar PDF
  private async generateFinalPDF(character: Character): Promise<void> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // --- Colores y Fuentes ---
    const COLOR_BG = '#191b20';
    const COLOR_CARD = '#2c2e3a';
    const COLOR_TEXT = '#f5f5f5';
    const COLOR_ACCENT = '#ce7b00';
    const COLOR_LABEL = '#9e9e9e';

    //  Background
    doc.setFillColor(COLOR_BG);
    doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');
    
    let yPos = margin;

    // Header
    const headerHeight = 50;
    doc.setFillColor(COLOR_CARD);
    doc.roundedRect(margin, yPos, pageW - (margin * 2), headerHeight, 3, 3, 'F');
    yPos += 18;
    
    // Imagen y Título Principal
    const imgSize = 40;
    const imgX = margin + 8;
    const imgY = yPos - 13;
    const imageData = await this.getImageBase64(character.image);
    doc.addImage(imageData, 'JPEG', imgX, imgY, imgSize, imgSize);

    // Texto del Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(COLOR_TEXT);
    const titleX = imgX + imgSize + 12;
    doc.text(character.name, titleX, yPos, { maxWidth: pageW - titleX - margin });

    // Status con punto de color
    yPos += 8;
    const statusColor = character.status === 'Alive' ? '#55cc44' : character.status === 'Dead' ? '#d63d2e' : '#9e9e9e';
    doc.setFillColor(statusColor);
    doc.circle(titleX, yPos - 1.5, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(COLOR_LABEL);
    doc.text(`${character.status} - ${character.species}`, titleX + 5, yPos);
    
    yPos += headerHeight - 15; 

     // Información con líneas divisorias
    doc.setFontSize(12);
    this.addInfoRow(doc, 'Genre:', character.gender, yPos, margin, pageW);
    yPos += 12;

    // Líneas divisoras
    doc.setDrawColor(COLOR_CARD); 
    doc.setLineWidth(0.2);
    doc.line(margin, yPos - 6, pageW - margin, yPos - 6);

    this.addInfoRow(doc, 'Origin:', character.origin.name, yPos, margin, pageW);
    yPos += 12;

    doc.line(margin, yPos - 6, pageW - margin, yPos - 6);

    this.addInfoRow(doc, 'Last Seen:', character.location.name, yPos, margin, pageW, COLOR_ACCENT);
    yPos += 15;
    
    // Episodios
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLOR_TEXT);
    doc.text('Appearences', margin, yPos);
    yPos += 1;
    doc.setDrawColor(COLOR_CARD);
    doc.line(margin, yPos, pageW - margin, yPos);
    yPos += 8;

    // Lista de 2 columnas
    if (character.episodeNames && character.episodeNames.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLOR_TEXT);

        const col1X = margin + 2;
        const col2X = margin + ((pageW - margin*2) / 2) + 2;
        const colWidth = ((pageW - margin*2) / 2) - 4;
        let currentX = col1X;
        let lineY = yPos;
        let maxLinesInThisRow = 0;

        character.episodeNames.forEach((name, i) => {
            const lines = doc.splitTextToSize(`• ${name}`, colWidth);
            maxLinesInThisRow = Math.max(maxLinesInThisRow, lines.length);
            doc.text(lines, currentX, lineY);

            if (i % 2 === 0) {
                currentX = col2X;
            } else {
                currentX = col1X;
                lineY += 5 * maxLinesInThisRow;
                maxLinesInThisRow = 0;
            }

            if (lineY > 270 && i < character.episodeNames.length - 1) {
                doc.addPage();
                doc.setFillColor(COLOR_BG); doc.rect(0,0,pageW, doc.internal.pageSize.getHeight(),'F');
                lineY = margin;
                currentX = col1X;
            }
        });
    }

    doc.save(`${character.name}_detail.pdf`);
  }

  //  Función para añadir filas de información 
  private addInfoRow(doc: jsPDF, label: string, value: string, y: number, margin: number, pageW: number, valueColor = '#f5f5f5') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#9e9e9e');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(valueColor);
    const labelWidth = doc.getTextWidth(label);
    doc.text(value, margin + labelWidth + 2, y, { maxWidth: pageW - margin*2 - labelWidth - 2 });
  }

  private async getImageBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  }
}