//
//  ServiceProvider.swift
//  TopShelf
//
//  Created by Egor A. Blinov on 05.10.18.
//  Copyright © 2018 Anton Ignatov. All rights reserved.
//

import Foundation
import TVServices

class ServiceProvider: NSObject, TVTopShelfProvider {

    override init() {
        super.init()
    }

    // MARK: - TVTopShelfProvider protocol

    var topShelfStyle: TVTopShelfContentStyle {
        // Return desired Top Shelf style.
        return .sectioned
    }

    var topShelfItems: [TVContentItem] {
        var SectionsItems = [TVContentItem]();

        do {
            
            if let userDefaults = UserDefaults(suiteName: "group.com.antonignatov.soap4me"),
                let topShelfString = userDefaults.string(forKey: "topShelf"),
                let topShelfData = topShelfString.data(using: String.Encoding.utf8, allowLossyConversion: false),
                let topShelf = try JSONSerialization.jsonObject(with: topShelfData) as? [String: Any] {

                for sectionData in topShelf["sections"] as! [[String: Any]] {
                    let sectionItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: sectionData["id"] as! String, container: nil)!)
                    
                    var sectionTopShelfItems = [TVContentItem]();
                    for itemData in sectionData["items"] as! [[String: Any]] {
                        let contentItem = TVContentItem(contentIdentifier: TVContentIdentifier(identifier: itemData["id"] as! String, container: nil)!)
                        
                        if let imageURLString = itemData["imageURL"] as? String,
                            let imageURL = URL(string: imageURLString) {
                            if #available(tvOSApplicationExtension 11.0, *) {
                                contentItem!.setImageURL(imageURL, forTraits: .userInterfaceStyleLight)
                                contentItem!.setImageURL(imageURL, forTraits: .userInterfaceStyleDark)
                            } else {
                                contentItem!.imageURL = imageURL
                            }
                        }
                        
                        if let displayURLString = itemData["displayURL"] as? String,
                            let displayURL = URL(string: displayURLString) {
                            contentItem!.displayURL = displayURL;
                        }
                        contentItem!.imageShape = .square
                        contentItem!.title = itemData["title"] as? String
                        sectionTopShelfItems.append(contentItem!)
                    }
                    
                    sectionItem!.title = sectionData["title"] as? String
                    
                    if sectionTopShelfItems.count > 0 {
                        sectionItem!.topShelfItems = sectionTopShelfItems
                        SectionsItems.append(sectionItem!)
                    }
                }
            }
        } catch {
            print("Error processing data: \(error)")
        }
        return SectionsItems
    }

}

