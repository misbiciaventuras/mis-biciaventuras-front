// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { generarColorAleatorio } from './utils/colorAleatorio';
import 'leaflet-gpx';
import { HttpClient } from '@angular/common/http';
import { archivosGeoJSON } from './utils/archivosGeoJSON';
import { Observable, forkJoin, map } from 'rxjs';
import * as dayjs from 'dayjs';
import { links } from './utils/links';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) {}

  map?: L.Map;
  panelExpanded: boolean = true;

  distanciaTotal = 0;
  distanciaRealizada = 0;
  distanciaPendiente = 0;

  recorridosJSON: any[] = []; // Array para almacenar las capas GeoJSON
  geoJsonLayers: L.GeoJSON[] = [];
  links: { url: string; logo: string }[] = links

  ngOnInit() {
    this.map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    const arrayRecorridosObservables: Observable<any>[] = [];
    let combinedRecorridosObservables: Observable<any[]>;
    archivosGeoJSON.forEach((ruta, idx) => {
      const arrayEtapasObservables: Observable<any>[] = [];
      let etapas: {
        name: any;
        distance: number;
        startTime: any;
        elevationGain: any;
        elevationLoss: any;
        movingTime: any;
        fileName: string;
        show_on_map: boolean;
      }[] = [];

      ruta.etapas.map((etapa) => {
        const observable = this.http.get(etapa.archivo).pipe(
          map((data: any) => {
            let properties = data.features[0].properties;
            properties.popupContent = `Nombre: ${properties.name},
                        Distancia: ${properties.distance},
                        Fecha: ${properties.startTime} `;
            properties.show_on_map = !ruta.pendiente;

            this.distanciaTotal += properties.distance;
            this.distanciaRealizada += !ruta.pendiente
              ? properties.distance
              : 0;
            this.distanciaPendiente += ruta.pendiente ? properties.distance : 0;

            etapas.push(properties);

            const geoJsonLayer = L.geoJSON(data, {
              style: {
                color: !ruta.pendiente ? 'blue' : 'red',
                weight: 5,
                opacity: !ruta.pendiente ? 0.65 : 0,
              },
              onEachFeature: this.onEachFeature,
              // filter: (feature) => feature.properties.show_on_map,
            })
              .on('mouseover', (e: any) => {
                if (!e.layer.feature.properties.show_on_map) return;
                e.layer.setStyle({ weight: 8, opacity: 1 });
              })
              .on('mouseout', (e: any) => {
                if (!e.layer.feature.properties.show_on_map) return;
                e.layer.setStyle({ weight: 5, opacity: 0.65 });
              })
              .addTo(this.map as L.Map);

            this.geoJsonLayers?.push(geoJsonLayer);
            return data;
          })
        );
        arrayEtapasObservables.push(observable);
      });

      const combinedEtapasObservables = forkJoin(arrayEtapasObservables);
      arrayRecorridosObservables.push(combinedEtapasObservables);

      this.recorridosJSON.push({
        name: ruta.nombreRuta,
        etapas,
        mostrarAll: !ruta.pendiente,
      });
    });
    combinedRecorridosObservables = forkJoin(arrayRecorridosObservables);
    combinedRecorridosObservables.subscribe(() => {
      this.recorridosJSON.sort((a, b) =>
        dayjs(a.etapas[0].startTime).diff(dayjs(b.etapas[0].startTime))
      );
      const bounds = L.featureGroup(this.geoJsonLayers).getBounds();
      this.map?.fitBounds(bounds);
    });
  }

  onEachFeature(feature: any, layer: any) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  }

  ajustarMapa(layers: any[]) {
    let bounds = layers[0].getBounds();
    layers.forEach((layer, index) => {
      if ((index = 0)) return;
      bounds.extend(layer.getBounds());
    });
    this.map?.fitBounds(bounds);
  }

  findLayerByFileName(name: any = 'all') {
    let selectedLayer: any[] = [];
    this.geoJsonLayers.map((layers) => {
      layers.eachLayer((layer: any) => {
        if (name === 'all' || layer?.feature?.properties?.name == name) {
          selectedLayer.push(layer);
        }
      });
    });
    return selectedLayer;
  }

  resaltarEtapa(name: any, resaltar: boolean) {
    const geoJsonLayer = this.findLayerByFileName(name);
    if (!geoJsonLayer[0].feature.properties.show_on_map) return;
    geoJsonLayer[0].setStyle({
      opacity: resaltar ? 1 : 0.65,
      weight: resaltar ? 8 : 5,
    });
  }

  resaltarRutaCompleta(etapas: any, resaltar: boolean) {
    etapas.map((etapa: any) => {
      this.resaltarEtapa(etapa.name, resaltar);
    });
  }

  zoomAll() {
    const geoJsonLayer = this.findLayerByFileName();
    this.ajustarMapa(geoJsonLayer);
  }

  zoomEnEtapa(name: string) {
    const geoJsonLayer = this.findLayerByFileName(name);
    this.ajustarMapa(geoJsonLayer);
  }

  zoomEnRecorrido(recorrido: any) {
    let layers: any[] = [];
    recorrido.etapas.map((etapa: any) => {
      layers.push(this.findLayerByFileName(etapa.name)[0]);
    });
    this.ajustarMapa(layers);
  }

  cambiarVisibilidadRecorrido(name: string, e: any, recorrido?: any) {
    const geoJsonLayer = this.findLayerByFileName(name);
    geoJsonLayer[0].setStyle({
      opacity: e.target.checked ? 1 : 0,
    });
    if (recorrido) {
      recorrido.mostrarAll = recorrido.etapas.every((etapa: any) => {
        return etapa.show_on_map;
      });
    }
  }

  checkUncheckAllRoutes(etapas: any[], e: any) {
    etapas.map((etapa: any) => {
      this.cambiarVisibilidadRecorrido(etapa.name, e);
      etapa.show_on_map = e.target.checked;
    });
  }

  generarPopupContenido(gpxData: any) {
    return `
      <strong>${gpxData.name}</strong><br>
      <strong>Fecha:</strong> ${new Date(gpxData.startTime).toLocaleDateString(
        'es-ES'
      )}<br>
      <strong>Distancia:</strong> ${gpxData.distance.toFixed(2)} km
    `;
  }

  handleChangeStatusPanel(event: any) {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }
}
