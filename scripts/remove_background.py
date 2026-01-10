#!/usr/bin/env python3
"""
Script pour supprimer le fond vert des images de bijoux et créer des PNG transparents.
"""

import cv2
import numpy as np
from pathlib import Path

def remove_green_background(input_path: str, output_path: str, tolerance: int = 40):
    """
    Supprime le fond vert d'une image et crée un PNG avec fond transparent.
    
    Args:
        input_path: Chemin vers l'image source
        output_path: Chemin vers l'image de sortie
        tolerance: Tolérance pour la détection du vert (0-255)
    """
    # Lire l'image
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print(f"Erreur: Impossible de lire {input_path}")
        return False
    
    # Convertir en BGRA si nécessaire
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Convertir en HSV pour une meilleure détection du vert
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)
    
    # Définir la plage de vert (ajustée pour #00FF00)
    lower_green = np.array([35, 100, 100])
    upper_green = np.array([85, 255, 255])
    
    # Créer le masque pour le vert
    mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Dilater légèrement le masque pour capturer les bords
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    
    # Appliquer un flou pour adoucir les bords
    mask = cv2.GaussianBlur(mask, (3, 3), 0)
    
    # Inverser le masque (le bijou devient blanc, le fond noir)
    mask_inv = cv2.bitwise_not(mask)
    
    # Appliquer le masque au canal alpha
    img[:, :, 3] = mask_inv
    
    # Sauvegarder l'image avec transparence
    cv2.imwrite(output_path, img)
    print(f"✓ Traité: {output_path}")
    return True


def process_all_jewelry_images():
    """Traite toutes les images de bijoux dans le dossier."""
    jewelry_dir = Path("/home/ubuntu/ecrin-mobile-app/assets/images/jewelry")
    
    images = [
        "necklace.png",
        "earrings.png",
        "ring.png",
        "bracelet.png",
        "anklet.png",
    ]
    
    for image_name in images:
        input_path = jewelry_dir / image_name
        output_path = jewelry_dir / image_name  # Écraser l'original
        
        if input_path.exists():
            remove_green_background(str(input_path), str(output_path))
        else:
            print(f"⚠ Image non trouvée: {input_path}")


if __name__ == "__main__":
    print("Suppression des fonds verts des images de bijoux...")
    process_all_jewelry_images()
    print("\nTerminé!")
